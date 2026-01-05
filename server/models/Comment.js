import mongoose from "mongoose"

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    content: { type: String, required: true },
    userId: { type: String, required: true },                      // Clerk user id
    user: {                                                       // User snapshot (for UI)
      username: { type: String, default: null },
      profile_picture: { type: String, default: "" }},
  }, { timestamps: true }
)

const Comment = mongoose.model("Comment", commentSchema)
export default Comment
