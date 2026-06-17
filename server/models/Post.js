import mongoose from "mongoose";

const postScema = new mongoose.Schema({
    user: {type: String, ref: 'User', required: true},
    content: {type: String },
    image_urls: [{ type: String, default: []}],
    post_type: {type: String, enum: ['text', 'image', 'text_with_image'], default: 'text'},
    postType: {type: String, enum: ['social', 'study_material'], default: 'social', index: true},
    studyMaterial: {type: mongoose.Schema.Types.ObjectId, ref: 'StudyMaterial'},
    likes_count: [{type: String, ref: 'User'}],
    commentCount: { type: Number },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
}, {timestamps: true, minimize: false})

const Post = mongoose.model('Post', postScema)

export default Post;
