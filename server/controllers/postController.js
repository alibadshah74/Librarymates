import imagekit from "../configs/imageKit.js";
import fs from 'fs'
import crypto from 'crypto'
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import StudyMaterial from "../models/StudyMaterial.js";

const ALLOWED_STUDY_MATERIAL_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar'];

const extractHashtags = (text = '') => {
    const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
    return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))].slice(0, 20);
};

const cleanupFiles = (files = []) => {
    files.forEach((file) => {
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    });
};

const getUploadedFiles = (req, field) => {
    if (Array.isArray(req.files)) {
        return field === 'images' ? req.files : [];
    }
    return req.files?.[field] || [];
};

const validateStudyMaterial = (body, file) => {
    const title = body.title?.trim();
    const description = body.description?.trim() || '';
    const hashtags = extractHashtags(`${title || ''} ${description}`);
    const price = body.price === '' || body.price === undefined ? 0 : Number(body.price);

    if (!title) throw new Error('Title is required');
    if (!file) throw new Error('Study material file is required');
    if (Number.isNaN(price) || price < 0) throw new Error('Price must be a valid non-negative number');

    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!ALLOWED_STUDY_MATERIAL_EXTENSIONS.includes(extension)) {
        throw new Error('Unsupported study material file type');
    }

    return {
        title,
        description,
        hashtags,
        price
    };
};


// add Post
export const addPost = async (req, res) => {
    const allFiles = [
        ...getUploadedFiles(req, 'images'),
        ...getUploadedFiles(req, 'studyMaterial')
    ];

    try {
        const { userId } = req.auth();
        const { content, post_type, postType = 'social' } = req.body;
        const images = getUploadedFiles(req, 'images')
        const studyMaterialFiles = getUploadedFiles(req, 'studyMaterial')

        if (postType === 'study_material') {
            if (images.length) {
                throw new Error('Image uploads are not allowed for study materials');
            }

            const materialData = validateStudyMaterial(req.body, studyMaterialFiles[0]);
            const file = studyMaterialFiles[0];
            const fileBuffer = fs.readFileSync(file.path);
            const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            const duplicateMaterial = await StudyMaterial.findOne({
                uploadedBy: userId,
                fileHash,
                title: new RegExp(`^${materialData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
            });

            if (duplicateMaterial) {
                throw new Error('This study material has already been uploaded');
            }

            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: file.originalname,
                folder: "/study-materials"
            });

            const studyMaterial = await StudyMaterial.create({
                ...materialData,
                fileUrl: response.url,
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                fileHash,
                uploadedBy: userId,
            });

            await Post.create({
                user: userId,
                content: materialData.description,
                image_urls: [],
                post_type: 'text',
                postType: 'study_material',
                studyMaterial: studyMaterial._id
            });

            cleanupFiles(allFiles);
            return res.json({ success: true, message: "Study material shared successfully" });
        }

        if (postType !== 'social') {
            throw new Error('Invalid post type');
        }

        let image_urls = []

        if (images.length) {
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path)
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: "posts"
                    })

                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' },
                        ]
                    })
                    return url

                })

            )

        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type,
            postType: 'social'
        })
        cleanupFiles(allFiles);
        res.json({ success: true, message: "Post created successfully" });
    } catch (error) {
        cleanupFiles(allFiles);
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}

// Get Post
export const getFeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        const userIds = [userId, ...user.following]
        const posts = await Post.find({ user: { $in: userIds }, isDeleted: { $ne: true } }).populate('user').populate('studyMaterial').sort({ createdAt: -1 })

        // ✅ yahin comment count add karo
        for (let post of posts) {
            post.commentCount = await Comment.countDocuments({
                post: post._id
            })
            // post.replyCount = await Comment.countDocuments({ 
            //     post: post._id, parent: comment._id 
            // })
        }

        res.json({ success: true, posts })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Likes post
export const likePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { postId } = req.body;

        const post = await Post.findOne({ _id: postId, isDeleted: { $ne: true } })
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        if (post.likes_count.includes(userId)) {
            post.likes_count = post.likes_count.filter(user => user !== userId)
            await post.save()
            res.json({ success: true, message: 'Post unliked' })
        } else {
            post.likes_count.push(userId)
            await post.save()
            res.json({ success: true, message: 'Post liked' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//get single post
export const getSinglePost = async (req, res)=> {
    try {
        const { id } = req.params
        const post = await Post.findOne({ _id: id, isDeleted: { $ne: true } }).populate('user').populate('studyMaterial')

        if(!post) {
            return res.status(404).json({ success: false, message: 'Page not found'})
        }

        res.json({ success: true, post})
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Update post content
export const updatePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.params
        const content = req.body.content?.trim() || ''

        const post = await Post.findOne({ _id: id, isDeleted: { $ne: true } })
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }
        if (post.user !== userId) {
            return res.status(403).json({ success: false, message: 'You can edit only your own post' })
        }
        if (post.postType !== 'social') {
            return res.status(400).json({ success: false, message: 'Study material posts cannot be edited here' })
        }
        if (!content && post.image_urls.length === 0) {
            return res.status(400).json({ success: false, message: 'Post cannot be empty' })
        }

        post.content = content
        await post.save()

        const updatedPost = await Post.findById(post._id).populate('user').populate('studyMaterial')
        updatedPost.commentCount = await Comment.countDocuments({ post: updatedPost._id })

        res.json({ success: true, message: 'Post updated', post: updatedPost })
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Soft delete post
export const deletePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.params

        const post = await Post.findOne({ _id: id, isDeleted: { $ne: true } })
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }
        if (post.user !== userId) {
            return res.status(403).json({ success: false, message: 'You can delete only your own post' })
        }

        post.isDeleted = true
        post.deletedAt = new Date()
        await post.save()

        res.json({ success: true, message: 'Post deleted' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
