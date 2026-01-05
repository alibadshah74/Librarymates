import React, { useState, useEffect, useRef, } from 'react'
import { BadgeCheck, Heart, MessageCircle, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react'
import moment from 'moment'
import { dummyUserData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Contextbar from './Contextbar'
import Commentsview from './Commentsview'


const PostCard = ({ post }) => {

  const { getToken } = useAuth()
  const navigate = useNavigate()

  const [likes, setLikes] = useState(post.likes_count)
  const [contextbarOpen, setContextbarOpen] = useState(false)
  const [openComments, setOpenComments] = useState(false)
  const [comments, setComments] = useState([])

  const currentUser = useSelector((state) => state.user.value)

  const menuRef = useRef(null)
  const isOwner = String(currentUser?._id) === String(post?.user?._id)

  const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')


  const handleLike = async () => {
    try {
      const { data } = await api.post(`/api/post/like`, { postId: post._id }, { headers: { Authorization: `Bearer ${await getToken()}` } })

      if (data.success) {
        toast.success(data.message)
        setLikes(prev => {
          if (prev.includes(currentUser._id)) {
            return prev.filter(id => id !== currentUser._id)
          } else {
            return [...prev, currentUser._id]
          }
        })
      } else {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCopyLink = async () =>{
    const postUrl = `${window.location.origin}/post/${post._id}`

    try {
      await navigator.clipboard.writeText(postUrl)
      // await api.post(`/api/post/share/${post._id}`)
      toast.success("Link copied to clipboard")
      console.log("Copied:", postUrl)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextbarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>
      {/* User Info  */}
      <div className='flex items-center justify-between'>
        <div onClick={() => navigate('/profile/' + post.user._id)} className='inline-flex items-center gap-3 cursor-pointer '>
          <img src={post.user.profile_picture} alt="" className='w-10 h-10 rounded-full shadow' />
          <div>
            <div className='flex items-center space-x-1'>
              <span>{post.user.full_name}</span>
              {/* <BadgeCheck className='w-4 h-4 text-blue-500' /> for username @{post.user.username}*/ }
            </div>
            <div className='text-gray-500 text-sm'> {moment(post.createdAt).fromNow()} </div>

          </div>
        </div>
        {/* THREE DOT MENU */}
        <div className="relative" ref={menuRef}>
          <MoreHorizontal className="p-2 w-9 h-9 cursor-pointer rounded-md text-gray-600 hover:text-gray-800"
            onClick={() => setContextbarOpen(prev => !prev)}
          />

          <Contextbar
            contextbarOpen={contextbarOpen}
            setContextbarOpen={setContextbarOpen}
            post={post}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* Content  */}
      {post.content && <div className='text-gray-800 text-sm whitespace-pre-line' dangerouslySetInnerHTML={{ __html: postWithHashtags }} />}

      {/* Images  */}
      <div className='grid grid-cols-1 gap-2'>
        {post.image_urls.map((img, index) => (
          <img src={img} key={index} className={`w-full h-48 object-cover rounded-lg ${post.image_urls.length === 1 && 'col-span-2 h-auto'}`} alt='' />
        ))}
      </div>

      <div className=' mt-0 mb-0 flex gap-2 text-gray-600 text-sm pt-1 border-t border-gray-300'>
        <div className='flex w-full'>
          <ThumbsUp className='w-4 h-4  text-blue-500 fill-blue-500 ' />
          <span>{likes.length}</span>
        </div>
        <div onClick={() => setOpenComments(true)} className='flex items-center gap-1 hover:underline cursor-pointer'>
          <span>{post.commentCount}</span>comments
        </div>
        <div className='flex items-center gap-1  hover:underline cursor-pointer'>
          <span>{0}</span>shares
        </div>
      </div>

      {/* Action  */}
      <div className='grid grid-cols-3   gap-4 text-gray-600 text-sm pt-2 rounded'>
        <div className='flex p-2 justify-center items-center gap-1 hover:bg-gray-100 rounded cursor-pointer' onClick={handleLike}>
          <ThumbsUp className={`w-4 h-4 ${likes.includes(currentUser._id) && 'text-blue-500 fill-blue-500'}`} /> Likes
        </div>
        <div className='flex justify-center items-center hover:bg-gray-100 rounded gap-1 cursor-pointer'>
          <div onClick={() => setOpenComments(true)} className='flex gap-1'>
            <MessageCircle className='w-4 h-4 ' /> Comment
          </div>

          {openComments && (
            <Commentsview postId={post._id} comments={comments} setComments={setComments} onClose={() => setOpenComments(false)} />
          )}
        </div>
        <div onClick={handleCopyLink} className='flex justify-center items-center hover:bg-gray-100 rounded gap-0.5 cursor-pointer'>
            <Share2 className='w-4 h-4 cursor-pointer' /> Share
        </div>

      </div>

  </div>
  )
}

export default PostCard
