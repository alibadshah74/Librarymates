import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { addPost, deletePost, getFeedPosts, getSinglePost, likePost, updatePost } from "../controllers/postController.js";

const postRouter = express.Router()

postRouter.post('/add', upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'studyMaterial', maxCount: 1 },
]), protect, addPost)
postRouter.get('/feed', protect, getFeedPosts)
postRouter.post('/like', protect, likePost)
postRouter.get('/single/:id', getSinglePost)
postRouter.patch('/:id', protect, updatePost)
postRouter.delete('/:id', protect, deletePost)


export default postRouter
