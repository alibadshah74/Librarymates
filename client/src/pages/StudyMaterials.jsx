import React, { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Loading from '../components/Loading'
import StudyMaterialCard from '../components/StudyMaterialCard'

const priceFilters = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    priceType: 'all',
    page: 1,
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === 'All') return
      params.set(key, value)
    })
    params.set('limit', '12')
    return params.toString()
  }, [filters])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get(`/api/study-materials?${queryString}`)
      if (data.success) {
        setMaterials(data.materials)
        setPagination(data.pagination)
      } else {
        setError(data.message || 'Unable to load study materials.')
        toast.error(data.message)
      }
    } catch (error) {
      const message = error.friendlyMessage || error.message
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [queryString])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }))
    }, 350)

    return () => clearTimeout(timeout)
  }, [searchInput])

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: field === 'page' ? value : 1 }))
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-6xl p-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-slate-900'>Study Materials</h1>
          <p className='mt-1 text-sm text-slate-600'>Find notes and resources by title, description, or hashtags.</p>
        </div>

        <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex flex-col gap-3 lg:flex-row'>
            <label className='flex min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-200 px-3 py-2 focus-within:border-indigo-400'>
              <Search className='size-5 shrink-0 text-slate-400' />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className='w-full outline-none text-sm' placeholder='Search title, description, or hashtags like #dbms' />
            </label>
            <div className='flex rounded-md border border-gray-200 bg-slate-50 p-1'>
              {priceFilters.map((filter) => (
                <button key={filter.value} type='button' onClick={() => updateFilter('priceType', filter.value)} className={`px-4 py-1.5 text-sm font-medium rounded ${filters.priceType === filter.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? <Loading /> : (
          <>
            {error && (
              <div className='mb-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700'>
                {error}
              </div>
            )}
            <div className='mb-3 text-sm text-slate-500'>{pagination.total} materials found{filters.search && ' by relevance'}</div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {materials.map((material) => <StudyMaterialCard key={material._id} material={material} compact />)}
            </div>
            {materials.length === 0 && (
              <div className='rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-slate-500'>
                No study materials match these filters.
              </div>
            )}
            <div className='mt-6 flex items-center justify-center gap-3'>
              <button disabled={pagination.page <= 1} onClick={() => updateFilter('page', pagination.page - 1)} className='rounded-md border border-gray-200 bg-white px-4 py-2 text-sm disabled:opacity-50'>Previous</button>
              <span className='text-sm text-slate-500'>Page {pagination.page} of {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => updateFilter('page', pagination.page + 1)} className='rounded-md border border-gray-200 bg-white px-4 py-2 text-sm disabled:opacity-50'>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StudyMaterials
