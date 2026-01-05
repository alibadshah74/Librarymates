import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../api/axios"
import PostCard from "../components/PostCard"
import { useAuth } from "@clerk/clerk-react"

const PostView = () => {
  const { id } = useParams()
  const { getToken, isLoaded, userId } = useAuth()

  const [sharedPost, setSharedPost] = useState(null)
  const [feedPosts, setFeedPosts] = useState([])

  useEffect(() => {
    // 🚨 IMPORTANT GUARD
    if (!isLoaded || !userId) return

    fetchSharedPost()
    fetchFeed()
  }, [id, isLoaded, userId])

  const fetchSharedPost = async () => {

    const res = await api.get(`/api/post/single/${id}`)

    if (res.data.success) {
      setSharedPost(res.data.post)
    }
  }

  const fetchFeed = async () => {
    const token = await getToken()
    if (!token) return

    const res = await api.get(
      "/api/post/feed",
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (res.data.success) {
      setFeedPosts(res.data.posts)
    }
  }

  if (!isLoaded) {
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
