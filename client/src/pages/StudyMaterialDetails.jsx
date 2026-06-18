import React, { useCallback, useEffect, useState } from 'react'
import { Download, Eye, FileText, Heart, MessageCircle, Send, Share2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Loading from '../components/Loading'
import StudyMaterialCard from '../components/StudyMaterialCard'

const StudyMaterialDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [material, setMaterial] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const applyCounts = (counts = {}) => {
    setMaterial((prev) => prev ? ({
      ...prev,
      likesCount: counts.likesCount ?? prev.likesCount,
      commentsCount: counts.commentsCount ?? prev.commentsCount,
      sharesCount: counts.sharesCount ?? prev.sharesCount,
      downloadsCount: counts.downloadsCount ?? prev.downloadsCount,
      viewsCount: counts.viewsCount ?? prev.viewsCount,
      liked: counts.liked ?? prev.liked,
      likes: counts.likesCount !== undefined ? Array(counts.likesCount).fill('') : prev.likes,
    }) : prev)
  }

  const fetchMaterial = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/api/study-materials/${id}`)
      if (data.success) {
        setMaterial(data.material)
        setRelated(data.related)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleDownload = async () => {
    try {
      const { data } = await api.post(`/api/study-materials/${id}/download`)
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

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/api/study-materials/${id}/like`, {}, {
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

  const handleShare = async () => {
    try {
      const { data } = await api.post(`/api/study-materials/${id}/share`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        applyCounts(data.counts)
        await navigator.clipboard?.writeText(window.location.href)
        toast.success('Link copied')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  const handleComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmittingComment(true)
      const { data } = await api.post(`/api/study-materials/${id}/comment`, { content: comment }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setMaterial((prev) => ({
          ...prev,
          comments: [data.comment, ...(prev.comments || [])],
        }))
        applyCounts(data.counts)
        setComment('')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  useEffect(() => {
    fetchMaterial()
  }, [fetchMaterial])

  if (loading) return <Loading />
  if (!material) return <div className='p-8 text-center text-sm text-slate-500'>Study material not found.</div>

  const uploader = material.uploadedBy
  const metadata = [
    ['File', material.fileName],
  ].filter(([, value]) => value)
  const likesCount = material.likesCount ?? material.likes?.length ?? 0
  const commentsCount = material.commentsCount || material.comments?.length || 0
  const sharesCount = material.sharesCount || 0

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-5xl p-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]'>
          <section className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div className='min-w-0'>
                <div className='mb-3 inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700'>
                  <FileText className='size-4' />
                  Study Material
                </div>
                <h1 className='text-3xl font-bold leading-tight text-slate-900 break-words'>{material.title}</h1>
              </div>
              <div className='rounded-lg bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-700'>{material.price ? `Rs ${material.price}` : 'Free'}</div>
            </div>

            <div className='mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {metadata.map(([label, value]) => (
                <div key={label} className='rounded-md bg-slate-50 px-3 py-2'>
                  <p className='text-xs font-medium uppercase text-slate-400'>{label}</p>
                  <p className='mt-0.5 text-sm font-semibold text-slate-700'>{value}</p>
                </div>
              ))}
            </div>

            {material.description && (
              <div className='mt-6'>
                <h2 className='text-lg font-semibold text-slate-900'>Description</h2>
                <p className='mt-2 whitespace-pre-line text-sm leading-6 text-slate-600'>{material.description}</p>
              </div>
            )}

            <div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5'>
              <div className='flex flex-wrap items-center gap-4 text-sm text-slate-500'>
                <button onClick={handleLike} className={`inline-flex items-center gap-1.5 hover:text-rose-600 ${material.liked ? 'text-rose-600' : ''}`}>
                  <Heart className={`size-4 ${material.liked ? 'fill-current' : ''}`} />{likesCount} likes
                </button>
                <span className='inline-flex items-center gap-1.5'><MessageCircle className='size-4' />{commentsCount} comments</span>
                <button onClick={handleShare} className='inline-flex items-center gap-1.5 hover:text-indigo-600'><Share2 className='size-4' />{sharesCount} shares</button>
                <span className='inline-flex items-center gap-1.5'><Download className='size-4' />{material.downloadsCount || 0} downloads</span>
                <span className='inline-flex items-center gap-1.5'><Eye className='size-4' />{material.viewsCount || 0} views</span>
              </div>
              <button onClick={handleDownload} className='inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'>
                <Download className='size-4' />
                Download
              </button>
            </div>

            <div className='mt-6 border-t border-gray-100 pt-5'>
              <h2 className='text-lg font-semibold text-slate-900'>Comments</h2>
              <form onSubmit={handleComment} className='mt-3 flex gap-2'>
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className='min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400'
                  placeholder='Add a comment'
                  maxLength={1000}
                />
                <button disabled={submittingComment || !comment.trim()} className='inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'>
                  <Send className='size-4' />
                  Post
                </button>
              </form>

              <div className='mt-4 space-y-3'>
                {(material.comments || []).map((item) => (
                  <div key={item._id || item.createdAt} className='rounded-md bg-slate-50 px-3 py-2'>
                    <div className='flex items-center gap-2'>
                      <img src={item.user?.profile_picture} alt='' className='size-7 rounded-full object-cover' />
                      <p className='text-sm font-semibold text-slate-800'>@{item.user?.username || 'student'}</p>
                    </div>
                    <p className='mt-2 text-sm leading-5 text-slate-600'>{item.content}</p>
                  </div>
                ))}
                {(!material.comments || material.comments.length === 0) && (
                  <p className='text-sm text-slate-500'>No comments yet.</p>
                )}
              </div>
            </div>
          </section>

          <aside className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 text-sm font-semibold uppercase text-slate-500'>Uploader</h2>
            <button onClick={() => navigate('/profile/' + uploader._id)} className='flex w-full items-center gap-3 text-left'>
              <img src={uploader.profile_picture} alt='' className='size-12 rounded-full object-cover shadow-sm' />
              <span className='min-w-0'>
                <span className='block truncate font-semibold text-slate-900'>{uploader.full_name}</span>
                <span className='block truncate text-sm text-slate-500'>@{uploader.username}</span>
              </span>
            </button>
            {uploader.bio && <p className='mt-3 text-sm leading-5 text-slate-600'>{uploader.bio}</p>}
          </aside>
        </div>

        {related.length > 0 && (
          <section className='mt-8'>
            <h2 className='mb-4 text-xl font-bold text-slate-900'>Related Materials</h2>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {related.map((item) => <StudyMaterialCard key={item._id} material={item} compact />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default StudyMaterialDetails
