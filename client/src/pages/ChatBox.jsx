import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { addMessage, fetchMessages, resetMessages } from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'

const ChatBox = () => {

  const { messages } = useSelector((state)=>state.messages)
  const currentUser = useSelector((state)=>state.user.value)
  const { userId } = useParams()
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const [text, setText] = useState('') //state variable
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const messagesEndRef = useRef(null)
  const canMessage = currentUser?.following?.includes(userId) || currentUser?.followers?.includes(userId)

  const fetchUserMessages = async () => {
    try {
      if (!canMessage) return
      const token = await getToken()
      dispatch(fetchMessages({token, userId}))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sendMessage = async () =>{
    try {
      if (!canMessage) return toast.error('You can message only accepted mates')
      if(!text && !image) return

      const token = await getToken()
      const formData = new FormData();
      formData.append('to_user_id', userId)
      formData.append('text', text);
      image && formData.append('image', image);
      const { data } = await api.post('/api/message/send', formData, {
        headers: { Authorization: `Bearer ${ token }`}
      })
      if(data.success){
        setText('')
        setImage(null)
        dispatch(addMessage(data.message))
      }else{
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    fetchUserMessages()

    return ()=>{
      dispatch(resetMessages())
    }
  },[userId, canMessage])

  useEffect(()=>{
    const fetchChatUser = async () => {
      try {
        const token = await getToken()
        const { data } = await api.post('/api/user/profiles', { profileId: userId }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data.success) {
          setUser(data.profile)
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }
    fetchChatUser()
  },[userId, canMessage])

  useEffect(()=> {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
  }, [messages])

  return user && (
    <div className='flex flex-col h-screen'>
      <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>
        <img src={user.profile_picture} alt="" className='size-8 rounded-full'/>
        <div>
          <p className='font-medium'>{user.full_name}</p>
          <p className='text-sm text-gray-500 -mt-1.5'>@{user.username}</p>
        </div>
      </div>
      <div className='p-5 md:px-10 h-full overflow-y-scroll'>
        <div className='space-y-4 max-w-4xl mx-auto'>
          {!canMessage && (
            <div className='rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-slate-500'>
              You can message each other after the mate request is accepted.
            </div>
          )}
          {
            messages.toSorted((a,b)=> new Date(a.createdAt) - new Date(b.createdAt)).map((message, index)=>(
              <div key={index} className={`flex flex-col ${message.to_user_id !== user._id ? 'items-start' : 'items-end'}`}>
                <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${message.to_user_id !== user._id  ? 'rounded-bl-none' : 'rounded-br-none'}`}>
                  {
                  message.message_type === 'image' && <img src={message.media_url} className='w-full max-w-sm rounded-lg mb-1' alt="" /> }
                  <p>{message.text}</p>
                </div>
              </div>
            ))
          }
          <div ref={messagesEndRef}/>
        </div>
      </div>
      <div className='px-4'>
          <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5'>
            <input type="text" disabled={!canMessage} className='flex-1 outline-none text-slate-700 disabled:bg-transparent disabled:text-slate-400' placeholder={canMessage ? 'Type a message...' : 'Become mates to message'}
            onKeyDown={e =>e.key === "Enter" && sendMessage()} onChange={(e) =>setText(e.target.value)} value={text}/>

            <label htmlFor="image">
              {
                image
                ? <img src={URL.createObjectURL(image)} className='h-8 rounded'/> 
                : <ImageIcon className='size-7 text-gray-400 cursor-pointer'/>
              }
              <input type="file" id='image' accept='image/*' hidden onChange={(e)=>setImage(e.target.files[0])} />
            </label>
            <button onClick={sendMessage} disabled={!canMessage} className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purpe-800 active:scale-95 cursor-pointer text-white p-2 rounded-full disabled:cursor-default disabled:opacity-50'>
              <SendHorizonal size={18}/>
            </button>
          </div>
      </div>
    </div>
  )
}

export default ChatBox
