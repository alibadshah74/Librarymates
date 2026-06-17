import express from 'express';
import { acceptMateRequest, declineMateRequest, discoverUsers, followUser, getMateRequests, getUserData, getUserNetwork, getUserProfiles, unfollowUser, updateUserData } from '../controllers/userControllers.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../configs/multer.js';
import { getUserRecentMessages } from '../controllers/messageController.js';

const userRouter = express.Router();

// API User Routes endpoints 
userRouter.get('/data',protect,  getUserData)
userRouter.post('/update', upload.fields([{name: 'profile', maxCount: 1}, {name: 'cover', maxCount: 1}]), protect,  updateUserData)
userRouter.post('/discover',protect,  discoverUsers)
userRouter.post('/follow',protect,  followUser)
userRouter.post('/mate-request/accept', protect, acceptMateRequest)
userRouter.post('/mate-request/decline', protect, declineMateRequest)
userRouter.get('/mate-requests', protect, getMateRequests)
userRouter.post('/unfollow',protect,  unfollowUser)
userRouter.get('/network', protect, getUserNetwork)
userRouter.post('/profiles', getUserProfiles)
userRouter.get('/recent-messages', protect, getUserRecentMessages)

export default userRouter
