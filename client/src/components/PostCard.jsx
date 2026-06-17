import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, MoreHorizontal, Share2, ThumbsUp, X } from 'lucide-react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Contextbar from './Contextbar'
import Commentsview from './Commentsview'
import StudyMaterialCard from './StudyMaterialCard'

const PostCard = ({ post }) => {
  const { getToken } = useAuth()
  const navigate = useNavigate()

  const [visiblePost, setVisiblePost] = useState(post)
  const [likes, setLikes] = useState(post.likes_count || [])
  const [contextbarOpen, setContextbarOpen] = useState(false)
  const [openComments, setOpenComments] = useState(false)
  const [comments, setComments] = useState([])
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const currentUser = useSelector((state) => state.user.value)

  const menuRef = useRef(null)
  const isOwner = String(currentUser?._id) === String(visiblePost?.user?._id)

  const postWithHashtags = (visiblePost.content || '').replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')

  const handleLike = async () => {
    try {
      const { data } = await api.post('/api/post/like', { postId: visiblePost._id }, { headers: { Authorization: `Bearer ${await getToken()}` } })

      if (data.success) {
        toast.success(data.message)
        setLikes(prev => {
          if (prev.includes(currentUser._id)) {
            return prev.filter(id => id !== currentUser._id)
          }
          return [...prev, currentUser._id]
        })
      } else {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${visiblePost._id}`

    try {
      await navigator.clipboard.writeText(postUrl)
      toast.success('Link copied to clipboard')
      console.log('Copied:', postUrl)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleSaveEdit = async () => {
    const nextContent = editContent.trim()

    if (!nextContent && visiblePost.image_urls.length === 0) {
      toast.error('Post cannot be empty')
      return
    }

    try {
      setSavingEdit(true)
      const { data } = await api.patch(`/api/post/${visiblePost._id}`, { content: nextContent }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        setVisiblePost(data.post)
        setEditContent(data.post.content || '')
        setEditing(false)
        toast.success('Post updated')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    } finally {
      setSavingEdit(false)
    }
  }

  useEffect(() => {
    setVisiblePost(post)
    setLikes(post.likes_count || [])
    setEditContent(post.content || '')
    setDeleted(false)
  }, [post])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextbarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (deleted) return null

  if (visiblePost.postType === 'study_material') {
    const material = visiblePost.studyMaterial
    if (!material) return null
    return <div className='w-full max-w-2xl'><StudyMaterialCard material={{ ...material, uploadedBy: visiblePost.user, description: material.description || visiblePost.content }} compact /></div>
  }

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>
      <div className='flex items-center justify-between'>
        <div onClick={() => navigate('/profile/' + visiblePost.user._id)} className='inline-flex items-center gap-3 cursor-pointer '>
          <img src={visiblePost.user.profile_picture} alt='' className='w-10 h-10 rounded-full shadow' />
          <div>
            <div className='flex items-center space-x-1'>
              <span>{visiblePost.user.full_name}</span>
            </div>
            <div className='text-gray-500 text-sm'> {moment(visiblePost.createdAt).fromNow()} </div>
          </div>
        </div>

        <div className='relative' ref={menuRef}>
          <MoreHorizontal
            className='p-2 w-9 h-9 cursor-pointer rounded-md text-gray-600 hover:text-gray-800'
            onClick={() => setContextbarOpen(prev => !prev)}
          />

          <Contextbar
            contextbarOpen={contextbarOpen}
            setContextbarOpen={setContextbarOpen}
            post={visiblePost}
            isOwner={isOwner}
            onEditRequest={() => {
              setEditContent(visiblePost.content || '')
              setEditing(true)
            }}
            onDeleted={() => setDeleted(true)}
          />
        </div>
      </div>

      {visiblePost.content && <div className='text-gray-800 text-sm whitespace-pre-line' dangerouslySetInnerHTML={{ __html: postWithHashtags }} />}

      <div className='grid grid-cols-1 gap-2'>
        {visiblePost.image_urls.map((img, index) => (
          <img src={img} key={index} className={`w-full h-48 object-cover rounded-lg ${visiblePost.image_urls.length === 1 && 'col-span-2 h-auto'}`} alt='' />
        ))}
      </div>

      <div className=' mt-0 mb-0 flex gap-2 text-gray-600 text-sm pt-1 border-t border-gray-300'>
        <div className='flex w-full'>
          <ThumbsUp className='w-4 h-4  text-blue-500 fill-blue-500 ' />
          <span>{likes.length}</span>
        </div>
        <div onClick={() => setOpenComments(true)} className='flex items-center gap-1 hover:underline cursor-pointer'>
          <span>{visiblePost.commentCount}</span>comments
        </div>
        <div className='flex items-center gap-1  hover:underline cursor-pointer'>
          <span>{0}</span>shares
        </div>
      </div>

      <div className='grid grid-cols-3   gap-4 text-gray-600 text-sm pt-2 rounded'>
        <div className='flex p-2 justify-center items-center gap-1 hover:bg-gray-100 rounded cursor-pointer' onClick={handleLike}>
          <ThumbsUp className={`w-4 h-4 ${likes.includes(currentUser._id) && 'text-blue-500 fill-blue-500'}`} /> Likes
        </div>
        <div className='flex justify-center items-center hover:bg-gray-100 rounded gap-1 cursor-pointer'>
          <div onClick={() => setOpenComments(true)} className='flex gap-1'>
            <MessageCircle className='w-4 h-4 ' /> Comment
          </div>

          {openComments && (
            <Commentsview postId={visiblePost._id} comments={comments} setComments={setComments} onClose={() => setOpenComments(false)} />
          )}
        </div>
        <div onClick={handleCopyLink} className='flex justify-center items-center hover:bg-gray-100 rounded gap-0.5 cursor-pointer'>
          <Share2 className='w-4 h-4 cursor-pointer' /> Share
        </div>
      </div>

      {editing && (
        <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4'>
          <div className='w-full max-w-lg rounded-xl bg-white p-4 shadow-xl'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-900'>Edit post</h2>
              <button onClick={() => setEditing(false)} className='rounded-md p-2 text-slate-500 hover:bg-slate-100'>
                <X className='size-5' />
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className='min-h-40 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-indigo-500'
              placeholder='Write something...'
            />
            <div className='mt-4 flex justify-end gap-2'>
              <button onClick={() => setEditing(false)} className='rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'>
                Cancel
              </button>
              <button disabled={savingEdit} onClick={handleSaveEdit} className='rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'>
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard
