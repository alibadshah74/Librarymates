import imagekit from "../configs/imageKit.js";
import fs from 'fs'
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";


// add Post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, post_type } = req.body;
        const images = req.files

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
            post_type
        })
        res.json({ success: true, message: "Post created successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get Post
export const getFeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        // User connection and followings
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({ user: { $in: userIds } }).populate('user').sort({ createdAt: -1 })

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

        const post = await Post.findById(postId)

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
        const post = await Post.findById(id).populate('user')

        if(!post) {
            return res.status(404).json({ success: false, message: 'Page not found'})
        }

        res.json({ success: true, post})
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}