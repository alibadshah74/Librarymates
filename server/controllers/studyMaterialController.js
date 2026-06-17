import StudyMaterial, { SHORT_KEYWORD_ALLOWLIST, STUDY_MATERIAL_STOP_WORDS, STUDY_MATERIAL_SYNONYMS } from "../models/StudyMaterial.js";

const normalize = (value = '') => value
    .toString()
    .toLowerCase()
    .replace(/#/g, ' ')
    .replace(/[^a-z0-9_]+/g, ' ')
    .trim();

const tokenizeQuery = (value = '') => normalize(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STUDY_MATERIAL_STOP_WORDS.has(token))
    .filter((token) => token.length >= 3 || SHORT_KEYWORD_ALLOWLIST.has(token));

const emptyPagination = (page, limit) => ({
    page,
    limit,
    total: 0,
    pages: 1,
});

const engagementProjection = {
    likes: 1,
    commentsCount: 1,
    sharesCount: 1,
    viewsCount: 1,
    downloadsCount: 1,
    viewCount: 1,
    downloadCount: 1,
};

const getEngagementCounts = (material, userId) => ({
    likesCount: material.likes?.length || 0,
    commentsCount: material.commentsCount || 0,
    sharesCount: material.sharesCount || 0,
    viewsCount: material.viewsCount || material.viewCount || 0,
    downloadsCount: material.downloadsCount || material.downloadCount || 0,
    liked: userId ? Boolean(material.likes?.includes(userId)) : false,
});

const buildSearchMatch = (rawSearch) => {
    const normalizedSearch = normalize(rawSearch);
    if (!normalizedSearch) return null;

    const tokens = tokenizeQuery(rawSearch);
    if (!tokens.length) return { invalid: true };

    const phrase = tokens.join(' ');
    const clauses = [];

    if (tokens.length === 1) {
        clauses.push({ searchableKeywords: tokens[0] });
    } else {
        clauses.push({ searchableKeywords: { $all: tokens } });
        clauses.push({ searchablePhrases: phrase });
    }

    (STUDY_MATERIAL_SYNONYMS[phrase] || []).forEach((synonym) => {
        const synonymTokens = tokenizeQuery(synonym);
        if (synonymTokens.length === 1) {
            clauses.push({ searchableKeywords: synonymTokens[0] });
        }
        if (synonymTokens.length > 1) {
            clauses.push({ searchableKeywords: { $all: synonymTokens } });
            clauses.push({ searchablePhrases: synonymTokens.join(' ') });
        }
    });

    return { $or: clauses };
};

const addRankingStages = () => ([
    {
        $addFields: {
            effectiveViewCount: { $max: [{ $ifNull: ['$viewCount', 0] }, { $ifNull: ['$viewsCount', 0] }] },
            effectiveDownloadCount: { $max: [{ $ifNull: ['$downloadCount', 0] }, { $ifNull: ['$downloadsCount', 0] }] },
            likeCount: { $size: { $ifNull: ['$likes', []] } },
            effectiveCommentCount: { $ifNull: ['$commentsCount', 0] },
            effectiveShareCount: { $ifNull: ['$sharesCount', 0] },
        }
    },
    {
        $addFields: {
            rankingScore: {
                $add: [
                    { $multiply: ['$effectiveViewCount', 0.40] },
                    { $multiply: ['$effectiveDownloadCount', 0.40] },
                    { $multiply: ['$likeCount', 0.10] },
                    { $multiply: ['$effectiveCommentCount', 0.05] },
                    { $multiply: ['$effectiveShareCount', 0.05] },
                ]
            }
        }
    },
]);

export const getStudyMaterials = async (req, res) => {
    try {
        const {
            search = '',
            priceType = 'all',
            page = 1,
            limit = 12,
        } = req.query;

        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 30);
        const query = {};
        const trimmedSearch = search.trim();

        if (priceType === 'free') query.price = 0;
        if (priceType === 'paid') query.price = { $gt: 0 };

        const searchMatch = buildSearchMatch(trimmedSearch);
        if (searchMatch?.invalid) {
            return res.json({
                success: true,
                materials: [],
                pagination: emptyPagination(safePage, safeLimit)
            });
        }
        if (searchMatch) Object.assign(query, searchMatch);

        const sort = trimmedSearch
            ? { rankingScore: -1, createdAt: -1 }
            : { createdAt: -1 };

        const pipeline = [
            { $match: query },
            ...addRankingStages(),
            { $sort: sort },
            {
                $facet: {
                    materials: [
                        { $skip: (safePage - 1) * safeLimit },
                        { $limit: safeLimit }
                    ],
                    total: [{ $count: 'count' }]
                }
            }
        ];

        const [result] = await StudyMaterial.aggregate(pipeline);
        const materials = await StudyMaterial.populate(result.materials, {
            path: 'uploadedBy',
            select: 'full_name username profile_picture bio'
        });
        const total = result.total[0]?.count || 0;

        res.json({
            success: true,
            materials,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                pages: Math.ceil(total / safeLimit) || 1,
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudyMaterialById = async (req, res) => {
    try {
        const material = await StudyMaterial.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewsCount: 1, viewCount: 1 } },
            { new: true }
        )
            .populate('uploadedBy', 'full_name username profile_picture bio followers following')
            .populate('comments.user', 'full_name username profile_picture');

        if (!material) {
            return res.status(404).json({ success: false, message: 'Study material not found' });
        }

        const related = await StudyMaterial.find({
            _id: { $ne: material._id },
            searchableKeywords: { $in: material.searchableKeywords || [] }
        })
            .populate('uploadedBy', 'full_name username profile_picture')
            .sort({ downloadCount: -1, downloadsCount: -1, createdAt: -1 })
            .limit(4);

        res.json({ success: true, material, related });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const downloadStudyMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloadsCount: 1, downloadCount: 1 } },
            { new: true, projection: { fileUrl: 1, ...engagementProjection } }
        );

        if (!material) {
            return res.status(404).json({ success: false, message: 'Study material not found' });
        }

        res.json({ success: true, fileUrl: material.fileUrl, counts: getEngagementCounts(material) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const likeStudyMaterial = async (req, res) => {
    try {
        const { userId } = req.auth();
        const material = await StudyMaterial.findById(req.params.id).select(engagementProjection);

        if (!material) {
            return res.status(404).json({ success: false, message: 'Study material not found' });
        }

        const hasLiked = material.likes.includes(userId);
        const update = hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
        const updatedMaterial = await StudyMaterial.findByIdAndUpdate(req.params.id, update, {
            new: true,
            projection: engagementProjection
        });

        res.json({
            success: true,
            message: hasLiked ? 'Study material unliked' : 'Study material liked',
            counts: getEngagementCounts(updatedMaterial, userId),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const commentOnStudyMaterial = async (req, res) => {
    try {
        const { userId } = req.auth();
        const content = req.body.content?.trim();

        if (!content) {
            return res.status(400).json({ success: false, message: 'Comment is required' });
        }

        const updatedMaterial = await StudyMaterial.findByIdAndUpdate(
            req.params.id,
            {
                $push: { comments: { user: userId, content } },
                $inc: { commentsCount: 1 }
            },
            { new: true, projection: { comments: { $slice: -1 }, ...engagementProjection } }
        ).populate('comments.user', 'full_name username profile_picture');

        if (!updatedMaterial) {
            return res.status(404).json({ success: false, message: 'Study material not found' });
        }

        res.status(201).json({
            success: true,
            comment: updatedMaterial.comments[0],
            counts: getEngagementCounts(updatedMaterial, userId),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const shareStudyMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findByIdAndUpdate(
            req.params.id,
            { $inc: { sharesCount: 1 } },
            { new: true, projection: engagementProjection }
        );

        if (!material) {
            return res.status(404).json({ success: false, message: 'Study material not found' });
        }

        res.json({ success: true, counts: getEngagementCounts(material, req.auth()?.userId) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
