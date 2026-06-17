import { ImageIcon, SendHorizonal, X } from "lucide-react"
import { React, useEffect, useState } from "react"
import api from "../api/axios"
import { useAuth } from "@clerk/clerk-react"
import toast from "react-hot-toast"

const CommentsView = ({ postId, comments, setComments, onClose }) => {
  const { getToken } = useAuth()
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [replyTo, setReplyTo] = useState(null)

  // ✅ FETCH COMMENTS
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = await getToken()
        const { data } = await api.get(`/api/comment/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data.success) setComments(data.comments)
      } catch (err) {
        toast.error(err.message)
        console.error(err)
      }
    }
    fetchComments()
  }, [postId, setComments, getToken])

  // ✅ ADD COMMENT
  const handleCommentSend = async () => {
    if (!text.trim() && !image) return

    try {
      const token = await getToken()

      // Backend automatically picks username & profile picture from Clerk
      const { data } = await api.post(
        "/api/comment/add", { postId, content: text, parent: null, }, { headers: { Authorization: `Bearer ${token}` } })

      if (data.success) {
        setComments(prev => [...prev, data.comment])
        toast.success("Comment added!")
        setText('') // Clear input
        setImage(null)
        setReplyTo(null)
      } else {
        toast.error(data.message || "Failed to add comment")
      }

      console.log(" Comment added:", data.comment)
    } catch (err) {
      console.error(" Error:", err)
      toast.error(err.response?.data?.message || "Something went wrong")
    }
  }

  // ✅ Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCommentSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999]">
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        <div className="bg-white rounded-t-2xl p-5 flex-1 overflow-hidden">

          {/* HEADER */}
          <div className=" sticky top-0 z-50 flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Comments</h2>
            <X className="cursor-pointer" onClick={onClose} />
          </div>

          {/* COMMENTS LIST */}
          <div className="overflow-y-auto max-h-[70vh] pr-1 space-y-4">
            {comments.map(comment => (
              <div className="flex gap-3 items-start">
                <img
                  src={comment.user?.profile_picture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{comment.user?.username}</p>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
                <button onClick={() => {
                  setReplyTo({ commentId: comment._id, username: comment.user?.username })
                  setText(`@${comment.user?.username}`)
                }} className="text-xs text-blue-500 hover:underline">
                  reply
                </button>
              </div>
            ))}
          </div>

          {/* INPUT BOX */}
          <div className="fixed bottom-0 left-0 right-0 p-3">
            { replyTo && (
              <div className="text-xs text-gray-500 mb-1 text-center">
                Replying to <b>@{replyTo.username}</b>
                <button onClick={() => { setReplyTo(null) 
                  setText('') }} className="ml-2 text-red-500">
                    X
                  </button>
              </div>
            )}
            <div className="max-w-2xl mx-auto ">
              <div className="px-4">
                <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">

                  <input
                    type="text" className="flex-1 outline-none text-slate-700" placeholder="Type a comment..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
                  />

                  <label htmlFor="comment-image">
                    {image ? (<img src={URL.createObjectURL(image)} className='h-8 w-8 rounded object-cover' alt="Selected" />
                    ) : (
                      <ImageIcon className='w-7 h-7 text-gray-400 cursor-pointer' />
                    )}
                    <input type="file" id="comment-image" hidden accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                  </label>

                  <button onClick={handleCommentSend} disabled={!text.trim() && !image} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                    <SendHorizonal size={18} />
                  </button>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CommentsView
