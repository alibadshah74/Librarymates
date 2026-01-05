import express from 'express'
import { addComment, getPostComments } from '../controllers/commentController.js';
import { protect } from '../middlewares/auth.js';


const commentRouter = express.Router();

commentRouter.post('/add', protect, addComment)
commentRouter.get('/:postId', protect , getPostComments)

export default commentRouter