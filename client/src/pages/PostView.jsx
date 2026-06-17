import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../api/axios"
import PostCard from "../components/PostCard"
import { useAuth } from "@clerk/clerk-react"
import toast from "react-hot-toast"

const PostView = () => {
  const { id } = useParams()
  const { getToken, isLoaded, userId } = useAuth()

  const [sharedPost, setSharedPost] = useState(null)
  const [feedPosts, setFeedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // 🚨 IMPORTANT GUARD
    if (!isLoaded || !userId) return

    const fetchData = async () => {
      setLoading(true)
      setError("")
      await Promise.all([fetchSharedPost(), fetchFeed()])
      setLoading(false)
    }

    fetchData()
  }, [id, isLoaded, userId])

  const fetchSharedPost = async () => {
    try {
      const res = await api.get(`/api/post/single/${id}`)

      if (res.data.success) {
        setSharedPost(res.data.post)
      } else {
        setError(res.data.message || "Post not found.")
      }
    } catch (error) {
      const message = error.friendlyMessage || error.message
      setError(message)
      toast.error(message)
    }
  }

  const fetchFeed = async () => {
    const token = await getToken()
    if (!token) return

    try {
      const res = await api.get(
        "/api/post/feed",
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data.success) {
        setFeedPosts(res.data.posts)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  if (!isLoaded || loading) {
    return <p className="text-center py-10">Loading...</p>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-5">
      {sharedPost && (
        <>
          <p className="text-sm text-gray-500">Shared Post</p>
          <PostCard post={sharedPost} />
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <hr />

      {feedPosts
        .filter(p => p._id !== id)
        .map(post => (
          <PostCard key={post._id} post={post} />
        ))}
    </div>
  )
}

export default PostView
