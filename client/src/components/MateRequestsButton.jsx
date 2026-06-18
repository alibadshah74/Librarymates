import React, { useCallback, useEffect, useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'

const MateRequestsButton = () => {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const refreshRequests = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await api.get('/api/user/mate-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setRequests(data.requests)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }, [getToken])

  const respond = async (id, action) => {
    try {
      const token = await getToken()
      const { data } = await api.post(`/api/user/mate-request/${action}`, { id }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        toast.success(data.message)
        setRequests((prev) => prev.filter((request) => request._id !== id))
        dispatch(fetchUser(token))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
    }
  }

  useEffect(() => {
    refreshRequests()
    const interval = setInterval(refreshRequests, 30000)
    return () => clearInterval(interval)
  }, [refreshRequests])

  return (
    <div className='relative flex justify-end'>
      <button onClick={() => setOpen((value) => !value)} className='relative inline-flex size-11 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-sm hover:bg-indigo-50'>
        <Bell className='size-5' />
        {requests.length > 0 && (
          <span className='absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white'>
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-12 z-20 w-[calc(100vw-1rem)] max-w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-xl'>
          <div className='mb-2 flex items-center justify-between'>
            <p className='font-semibold text-slate-900'>Mate requests</p>
            <span className='text-xs text-slate-500'>{requests.length} pending</span>
          </div>
          <div className='max-h-80 overflow-y-auto'>
            {requests.map((request) => (
              <div key={request._id} className='flex items-center gap-3 border-t border-gray-100 py-3 first:border-t-0'>
                <img src={request.profile_picture} alt='' className='size-10 rounded-full object-cover' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-slate-800'>{request.full_name}</p>
                  <p className='truncate text-xs text-slate-500'>@{request.username}</p>
                </div>
                <button onClick={() => respond(request._id, 'accept')} className='inline-flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700'>
                  <Check className='size-4' />
                </button>
                <button onClick={() => respond(request._id, 'decline')} className='inline-flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200'>
                  <X className='size-4' />
                </button>
              </div>
            ))}
            {requests.length === 0 && (
              <p className='py-6 text-center text-sm text-slate-500'>No mate requests right now.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MateRequestsButton
