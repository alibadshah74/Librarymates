import React, { useState } from 'react'
import { FileText, Image, UploadCloud, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelector} from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

const studyMaterialAccept = '.pdf,.doc,.docx,.ppt,.pptx,.zip,.rar'
const allowedStudyMaterialExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar']

const CreatePost = () => {

  const navigate = useNavigate()
  const [mode, setMode] = useState('social')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [studyMaterialFile, setStudyMaterialFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [materialForm, setMaterialForm] = useState({
    title: '',
    price: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  const user = useSelector((state)=>state.user.value);

  const { getToken } = useAuth()

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setUploadProgress(0)
    if (nextMode === 'social') {
      setStudyMaterialFile(null)
    } else {
      setImages([])
    }
  }

  const updateMaterialForm = (field, value) => {
    setMaterialForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleStudyMaterialSelect = (file) => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!allowedStudyMaterialExtensions.includes(extension)) {
      return toast.error('Please upload PDF, DOC/DOCX, PPT/PPTX, ZIP, or RAR files only')
    }
    setStudyMaterialFile(file)
    setUploadProgress(0)
  }

  const validateStudyMaterialForm = () => {
    if (!materialForm.title.trim()) return 'Title is required'
    if (!studyMaterialFile) return 'Please upload a study material file'
    if (materialForm.price && Number(materialForm.price) < 0) return 'Price cannot be negative'
    return ''
  }

  const handleSubmit = async () =>{
    if(mode === 'social' && !images.length && !content){
      throw new Error('Please add at least one image or text')
    }

    if (mode === 'study_material') {
      const validationError = validateStudyMaterialForm()
      if (validationError) throw new Error(validationError)
    }

    setLoading(true)
    setUploadProgress(0)

    const postType = images.length && content ? 'text_with_image' : images.length ? 'image' : 'text'

    try {
      const formData = new FormData();
      formData.append('content', content)
      formData.append('postType', mode === 'study_material' ? 'study_material' : 'social')

      if (mode === 'study_material') {
        formData.append('title', materialForm.title.trim())
        formData.append('price', materialForm.price)
        formData.append('description', materialForm.description.trim())
        formData.append('studyMaterial', studyMaterialFile)
      } else {
        formData.append('post_type', postType)
        images.map((image) => {
          formData.append('images', image)
        })
      }

      const { data } = await api.post('/api/post/add', formData, { headers: {
        Authorization: `Bearer ${await getToken()}`
      },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return
        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
      }})

      if(data.success){
        navigate('/')
      }else{
        throw new Error(data.message)
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>  
        {/* Title  */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Create Post</h1>
          <p className='text-slate-600'>Share your thoughts with the world</p>
        </div>

        {/* Form  */}
        <div className='max-w-xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4'>
            {/* Header  */}
            <div className='flex items-center gap-3'>
              <img src={user.profile_picture} alt="" className='w-12 h-12 rounded-full shadow'/>
              <div>
                <h2 className='font-semibold'>{user.full_name}</h2>
                <p className='text-sm text-gray-500'>@{user.username}</p>
              </div>
            </div>

            {/* Text Area  */}
            {mode === 'social' && <textarea className='w-full resize-none min-h-20 max-h-28 mt-4 text-sm outline-none placeholder-gray-400' placeholder="What's happening?" id="" onChange={(e) =>setContent(e.target.value)} value={content}/>}

            {mode === 'study_material' && (
              <div className='space-y-3'>
                <input className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400' placeholder='Title *' value={materialForm.title} onChange={(e) => updateMaterialForm('title', e.target.value)} />
                <input className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400' placeholder='Price (optional)' type='number' min='0' value={materialForm.price} onChange={(e) => updateMaterialForm('price', e.target.value)} />
                <textarea className='w-full resize-none min-h-24 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none placeholder-gray-400 focus:border-indigo-400' placeholder='Description (optional). Add hashtags like #dbms #database #sql for discovery.' value={materialForm.description} onChange={(e) => updateMaterialForm('description', e.target.value)} />
                <label htmlFor='studyMaterial' className='flex items-center justify-between gap-3 rounded-md border border-dashed border-indigo-200 bg-indigo-50/60 px-3 py-3 text-sm text-slate-600 cursor-pointer hover:border-indigo-300'>
                  <span className='inline-flex min-w-0 items-center gap-2'>
                    <UploadCloud className='size-5 text-indigo-500 shrink-0'/>
                    <span className='truncate'>{studyMaterialFile ? studyMaterialFile.name : 'Upload PDF, DOC, PPT, ZIP, or RAR'}</span>
                  </span>
                  <span className='text-xs text-indigo-600 shrink-0'>{studyMaterialFile ? `${(studyMaterialFile.size / 1024 / 1024).toFixed(2)} MB` : 'Choose file'}</span>
                </label>
                <input type='file' id='studyMaterial' accept={studyMaterialAccept} hidden onChange={(e)=> handleStudyMaterialSelect(e.target.files?.[0])} />
                {(studyMaterialFile || uploadProgress > 0) && (
                  <div className='space-y-1'>
                    <div className='flex justify-between text-xs text-gray-500'>
                      <span className='truncate'>{studyMaterialFile?.name}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className='h-2 rounded-full bg-gray-100 overflow-hidden'>
                      <div className='h-full bg-indigo-500 transition-all' style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Images  */}
            {
              mode === 'social' && images.length > 0 && <div className='flex flex-wrap gap-2 mt-4'>
                {images.map((image, i) =>(
                  <div key={i} className='relative group'>
                    <img src={URL.createObjectURL(image)} className='h-20 rounded-md' alt="" />
                    <div onClick={()=> setImages(images.filter((_, index)=> index !== i))} className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'>
                      <X className='w-6 h-6 text-white'/>
                    </div>
                  </div>
                ))}
              </div>
            }

            {/* Bottom Bar  */}
            <div className='flex items-center justify-between pt-3 border-t border-gray-300'>
              <div className='flex items-center gap-2'>
                <label htmlFor="images" onClick={() => switchMode('social')} className={`flex items-center gap-2 rounded-md p-2 text-sm transition cursor-pointer ${mode === 'social' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Image className='size-6'/>
                </label>
                <button type='button' onClick={() => switchMode('study_material')} className={`rounded-md p-2 transition cursor-pointer ${mode === 'study_material' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title='Study Material'>
                  <FileText className='size-6'/>
                </button>
              </div>

              <input type="file" id='images' accept='image/*' hidden multiple onChange={(e)=> setImages([...images, ...e.target.files])} />

              <button disabled={loading} onClick={()=> toast.promise(
                handleSubmit(),
                {
                  loading: 'uploading ...',
                  success: <p>Post Added</p>,
                  error: (error) => <p>{error.message || 'Post Not Added'}</p>,
                }
              )} className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600  hover:from-indigo-600  hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'>
                Publish Post
              </button>
            </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
