import React, { useCallback, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import MateRequestsButton from '../components/MateRequestsButton'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const Feed = () => {

  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { getToken } = useAuth()

  const fetchFeeds = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get('/api/post/feed', { headers: { Authorization: `Bearer ${await getToken()}`}})

      if(data.success){
        setFeeds(data.posts)
      }else{
        setError(data.message || 'Unable to load your feed.')
        toast.error(data.message)
      }
    } catch (error) {
      const message = error.friendlyMessage || error.message
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(()=>{
    fetchFeeds()
  },[fetchFeeds])


  return !loading ? (
    <div className='relative h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8'>
      <div className='fixed right-16 top-3 z-30 sm:absolute sm:right-5 sm:top-5 sm:z-10'>
        <MateRequestsButton/>
      </div>
      {/* Stories and post List */}
      <div>
        <StoriesBar/>
        <div className='p-4 space-y-6'>
          {error && (
            <div className='rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700'>
              {error}
            </div>
          )}
          {feeds.map((post)=>(
            <PostCard key={post._id} post={post}/>
          ))}
          {!error && feeds.length === 0 && (
            <div className='rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-slate-500'>
              No posts to show yet.
            </div>
          )}
        </div>
      </div>
      {/* Right Sidebar */}
      <div className='max-xl:hidden sticky top-0'>
        <div className='max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>
        <h3 className='text-slate-800 font-semibold'>Sponsored</h3>
        <img src={assets.sponsored_img} className='w-75 h-50 rounded-md' alt="" />
        <p className='text-slate-600'>Email marketing</p>
        <p className='text-slate-400'>Supercharge your marketing with a powerful, easy-to-use platform built for results.</p>
        </div>
        <RecentMessages/>
      </div>
    </div>
  ) : <Loading/>
}

export default Feed
