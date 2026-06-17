import mongoose from "mongoose";

export const STUDY_MATERIAL_STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'am', 'are', 'my', 'this', 'that', 'it', 'of', 'for', 'to', 'in', 'on'
]);

export const SHORT_KEYWORD_ALLOWLIST = new Set(['ai', 'ml', 'ds', 'dbms', 'os', 'cn']);

export const STUDY_MATERIAL_SYNONYMS = {
    ai: ['artificial intelligence'],
    'artificial intelligence': ['ai'],
    ml: ['machine learning'],
    'machine learning': ['ml'],
    ds: ['data science', 'data structures'],
    'data science': ['ds'],
    'data structures': ['ds'],
    dbms: ['database management system', 'database management systems'],
    'database management system': ['dbms'],
    'database management systems': ['dbms'],
    os: ['operating system', 'operating systems'],
    'operating system': ['os'],
    'operating systems': ['os'],
    cn: ['computer networks', 'computer networking'],
    'computer networks': ['cn'],
    'computer networking': ['cn'],
};

const normalizeText = (value = '') => value
    .toString()
    .toLowerCase()
    .replace(/#/g, ' ')
    .replace(/[^a-z0-9_]+/g, ' ')
    .trim();

const tokenizeSearchableText = (value = '') => normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STUDY_MATERIAL_STOP_WORDS.has(token))
    .filter((token) => token.length >= 3 || SHORT_KEYWORD_ALLOWLIST.has(token));

const unique = (values = []) => [...new Set(values.filter(Boolean))];

export const buildStudyMaterialSearchData = ({ title = '', description = '', hashtags = [] } = {}) => {
    const source = [
        title,
        description,
        ...(hashtags || []).map((tag) => tag.replace(/^#/, ''))
    ].join(' ');
    const tokens = tokenizeSearchableText(source);
    const phrases = new Set();

    for (let size = 2; size <= 5; size += 1) {
        for (let index = 0; index <= tokens.length - size; index += 1) {
            phrases.add(tokens.slice(index, index + size).join(' '));
        }
    }

    const keywords = new Set(tokens);
    const expandedPhrases = new Set(phrases);

    [...keywords, ...phrases].forEach((term) => {
        (STUDY_MATERIAL_SYNONYMS[term] || []).forEach((synonym) => {
            const synonymTokens = tokenizeSearchableText(synonym);
            if (synonymTokens.length === 1) keywords.add(synonymTokens[0]);
            if (synonymTokens.length > 1) {
                expandedPhrases.add(synonymTokens.join(' '));
                synonymTokens.forEach((token) => keywords.add(token));
            }
        });
    });

    return {
        searchableKeywords: unique([...keywords]),
        searchablePhrases: unique([...expandedPhrases])
    };
};

const studyMaterialSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 1000 },
    hashtags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    price: { type: Number, min: 0, default: 0 },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileHash: { type: String, required: true },
    uploadedBy: { type: String, ref: 'User', required: true },
    downloadsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    likes: [{ type: String, ref: 'User' }],
    comments: [{
        user: { type: String, ref: 'User', required: true },
        content: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now }
    }],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    searchableKeywords: [{ type: String, lowercase: true, trim: true }],
    searchablePhrases: [{ type: String, lowercase: true, trim: true }],
}, { timestamps: true, minimize: false });

studyMaterialSchema.pre('validate', function buildSearchFields(next) {
    const searchData = buildStudyMaterialSearchData(this);
    this.searchableKeywords = searchData.searchableKeywords;
    this.searchablePhrases = searchData.searchablePhrases;
    this.downloadCount = this.downloadCount || this.downloadsCount || 0;
    this.viewCount = this.viewCount || this.viewsCount || 0;
    this.commentsCount = this.commentsCount ?? (this.comments?.length || 0);
    next();
});

studyMaterialSchema.index({ uploadedBy: 1, title: 1, fileHash: 1 }, { unique: true });
studyMaterialSchema.index({ searchableKeywords: 1 });
studyMaterialSchema.index({ searchablePhrases: 1 });
studyMaterialSchema.index({ price: 1, createdAt: -1 });
studyMaterialSchema.index({ uploadedBy: 1 });
studyMaterialSchema.index({ downloadCount: -1, viewCount: -1, createdAt: -1 });
studyMaterialSchema.index({ downloadsCount: -1, viewsCount: -1, createdAt: -1 });
studyMaterialSchema.index({ createdAt: -1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

export default StudyMaterial;
