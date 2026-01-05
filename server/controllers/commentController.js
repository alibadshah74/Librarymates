import Comment from "../models/Comment.js"
import User from "../models/User.js"

export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { postId, content } = req.body

    if (!userId || !postId || !content) {
      return res.status(400).json({ success: false, message: "Missing fields" })
    }

    // ✅ REAL USER FETCH FROM DB
    const user = await User.findById(userId).select("username profile_picture")

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const comment = await Comment.create({
      post: postId,
      content,
      userId,
      user: {
        username: user.username,                 // ✅ REAL USERNAME
        profile_picture: user.profile_picture    // ✅ REAL IMAGE
      }
    })
    return res.status(201).json({ success: true, comment })

  } catch (error) {
    console.error("❌ Add comment error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

 //GET COMMENTS OF A POST
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .lean()

    return res.status(200).json({ success: true, comments })

  } catch (error) {
    console.error("❌ Get comments error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
