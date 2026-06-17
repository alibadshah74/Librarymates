import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Users } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import api, { getApiErrorMessage } from '../api/axios'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const Discover = () => {
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const { getToken } = useAuth()
  const requestIdRef = useRef(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(input.trim())
    }, 350)

    return () => clearTimeout(timeout)
  }, [input])

  const fetchUsers = async (page = 1) => {
    if (search.trim().length < 3) {
      setUsers([])
      setPagination({ page: 1, pages: 1, total: 0 })
      setLoading(false)
      setLoadingMore(false)
      setError('')
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    try {
      page === 1 ? setLoading(true) : setLoadingMore(true)
      setError('')
      const { data } = await api.post('/api/user/discover', { input: search, page, limit: 12 }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (requestId !== requestIdRef.current) return

      if (data.success) {
        setUsers((prev) => page === 1 ? data.users : [...prev, ...data.users])
        setPagination(data.pagination)
      } else {
        setError(data.message || 'Unable to load people.')
        toast.error(data.message)
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        const message = getApiErrorMessage(error, 'Unable to load people.')
        setError(message)
        toast.error(message)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    setPagination({ page: 1, pages: 1, total: 0 })
    fetchUsers(1)
  }, [search])

  const hasMore = useMemo(() => pagination.page < pagination.pages, [pagination])

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Discover People</h1>
          <p className='text-slate-600'>Find classmates, educators, and resource contributors.</p>
        </div>

        <div className='mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5' />
            <input
              type='search'
              placeholder='Search by username or display name...'
              className='w-full rounded-md border border-gray-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-indigo-400'
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </div>
          <p className='mt-3 text-sm text-slate-500'>{pagination.total} people found</p>
          {input.trim().length > 0 && input.trim().length < 3 && (
            <p className='mt-2 text-xs text-slate-400'>Enter at least 3 characters to search.</p>
          )}
        </div>

        {loading ? (
          <Loading height='50vh' />
        ) : (
          <>
            {error && (
              <div className='mb-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700'>
                {error}
              </div>
            )}

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {users.map((user) => (
                <UserCard user={user} key={user._id} />
              ))}
            </div>

            {users.length === 0 && (
              <div className='rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center'>
                <Users className='mx-auto mb-3 size-10 text-slate-300' />
                <p className='font-medium text-slate-700'>No people found</p>
                <p className='mt-1 text-sm text-slate-500'>Try a different username or display name.</p>
              </div>
            )}

            {hasMore && (
              <div className='mt-6 flex justify-center'>
                <button
                  disabled={loadingMore}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className='rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60'
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Discover
