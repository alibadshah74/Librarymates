import React, { useEffect, useState } from 'react'
import { Download, Eye, FileText, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const StudyMaterialCard = ({ material, compact = false }) => {
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()
  const [currentMaterial, setCurrentMaterial] = useState(material)
  const uploader = currentMaterial.uploadedBy || currentMaterial.user
  const priceLabel = currentMaterial.price ? `Rs ${currentMaterial.price}` : 'Free'

  useEffect(() => {
    setCurrentMaterial(material)
  }, [material])

  const applyCounts = (counts = {}) => {
    setCurrentMaterial((prev) => ({
      ...prev,
      likesCount: counts.likesCount ?? prev.likesCount,
      commentsCount: counts.commentsCount ?? prev.commentsCount,
      sharesCount: counts.sharesCount ?? prev.sharesCount,
      downloadsCount: counts.downloadsCount ?? prev.downloadsCount,
      viewsCount: counts.viewsCount ?? prev.viewsCount,
      liked: counts.liked ?? prev.liked,
      likes: counts.likesCount !== undefined ? Array(counts.likesCount).fill('') : prev.likes,
    }))
  }

  const likesCount = currentMaterial.likesCount ?? currentMaterial.likes?.length ?? 0
  const commentsCount = currentMaterial.commentsCount || 0
  const sharesCount = currentMaterial.sharesCount || 0

  const handleDownload = async (event) => {
    event.stopPropagation()
    try {
      const { data } = await api.post(`/api/study-materials/${currentMaterial._id}/download`)
      if (data.success) {
        applyCounts(data.counts)
        window.open(data.fileUrl, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  const handleLike = async (event) => {
    event.stopPropagation()
    if (!isSignedIn) return toast.error('Please sign in to like materials')

    try {
      const { data } = await api.post(`/api/study-materials/${currentMaterial._id}/like`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        applyCounts(data.counts)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  const handleShare = async (event) => {
    event.stopPropagation()
    try {
      const url = `${window.location.origin}/study-material/${currentMaterial._id}`
      const { data } = await api.post(`/api/study-materials/${currentMaterial._id}/share`, {}, {
        headers: isSignedIn ? { Authorization: `Bearer ${await getToken()}` } : {}
      })
      if (data.success) {
        applyCounts(data.counts)
        await navigator.clipboard?.writeText(url)
        toast.success('Link copied')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  const openProfile = (event) => {
    event.stopPropagation()
    if (uploader?._id) navigate('/profile/' + uploader._id)
  }

  return (
    <article onClick={() => navigate('/study-material/' + currentMaterial._id)} className='w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md cursor-pointer'>
      <div className='flex items-start gap-3'>
        <button onClick={openProfile} className='shrink-0'>
          <img src={uploader?.profile_picture} alt='' className='size-11 rounded-full object-cover shadow-sm' />
        </button>
        <div className='min-w-0 flex-1'>
          <button onClick={openProfile} className='block max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-indigo-600'>
            {uploader?.full_name || 'Study Mate User'}
          </button>
          <p className='truncate text-xs text-slate-500'>@{uploader?.username || 'student'}</p>
        </div>
        <span className='rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700'>{priceLabel}</span>
      </div>

      <div className='mt-4 flex items-start gap-3'>
        <div className='mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600'>
          <FileText className='size-5' />
        </div>
        <div className='min-w-0'>
          <h3 className='text-lg font-bold leading-snug text-slate-900 break-words'>{currentMaterial.title}</h3>
        </div>
      </div>

      {currentMaterial.description && (
        <p className={`mt-3 text-sm leading-5 text-slate-600 ${compact ? 'line-clamp-2' : ''}`}>{currentMaterial.description}</p>
      )}

      <div className='mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-slate-500'>
        <div className='flex flex-wrap items-center gap-3'>
          <button onClick={handleLike} className={`inline-flex items-center gap-1 hover:text-rose-600 ${currentMaterial.liked ? 'text-rose-600' : ''}`}>
            <Heart className={`size-3.5 ${currentMaterial.liked ? 'fill-current' : ''}`} />{likesCount}
          </button>
          <span className='inline-flex items-center gap-1'><MessageCircle className='size-3.5' />{commentsCount}</span>
          <button onClick={handleShare} className='inline-flex items-center gap-1 hover:text-indigo-600'><Share2 className='size-3.5' />{sharesCount}</button>
          <span className='inline-flex items-center gap-1'><Download className='size-3.5' />{currentMaterial.downloadsCount || 0}</span>
          <span className='inline-flex items-center gap-1'><Eye className='size-3.5' />{currentMaterial.viewsCount || 0}</span>
        </div>
        <button onClick={handleDownload} className='inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700'>
          <Download className='size-4' />
          Download
        </button>
      </div>
    </article>
  )
}

export default StudyMaterialCard
