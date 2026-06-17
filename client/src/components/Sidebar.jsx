import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems'
import { CirclePlus, LogOut } from 'lucide-react'
import {UserButton, useClerk} from '@clerk/clerk-react'
import { useSelector} from 'react-redux'

const StudyMaterialMark = () => (
  <span className='flex size-11 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm'>
    <svg viewBox='0 0 48 48' aria-hidden='true' className='size-7'>
      <path d='M12 9.5h13.5c4.7 0 8.5 3.8 8.5 8.5v20.5H20.5c-4.7 0-8.5-3.8-8.5-8.5v-21Z' fill='none' stroke='currentColor' strokeWidth='3.2' strokeLinejoin='round' />
      <path d='M18 17h10M18 23h14M18 29h9' stroke='currentColor' strokeWidth='3.2' strokeLinecap='round' />
      <path d='M34 18h3.5c2 0 3.5 1.6 3.5 3.5v17H34V18Z' fill='currentColor' opacity='.22' />
    </svg>
  </span>
)

const Sidebar = ({sidebarOpen, setSidebarOpen}) => {

  const navigate = useNavigate()
  const user = useSelector((state)=> state.user.value)
  const {signOut} =useClerk()
  return (
      <div className={`h-screen w-60 shrink-0 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:fixed top-0 bottom-0 z-20 ${sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
        <div className='w-full'>
              <button onClick={() => navigate('/')} className='mx-6 my-5 flex items-center gap-3 text-left cursor-pointer'>
                <StudyMaterialMark />
                <span>
                  <span className='block text-2xl font-bold tracking-normal text-slate-900'>Study Mate</span>
                  <span className='block text-xs font-medium uppercase tracking-[0.18em] text-slate-400'>Academic Hub</span>
                </span>
              </button>
              <hr className='border-gray-300 mb-8' />

              <MenuItems setSidebarOpen={setSidebarOpen}/>

              <Link to ='/create-post' className='flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition text-white cursor-pointer'>
                  <CirclePlus className='w-5 h-5'/>
                  Create Post
              </Link>
        </div>

        <div className='w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between'>
              <div className='flex gap-2 items-center cursor-pointer'>
                    <UserButton/>
                    <div>
                      <h1 className='text-sm font-medium'>{user.full_name}</h1>
                      <p className='text-xs text-gray-500'>@{user.username}</p>
                    </div>
              </div>
              <LogOut onClick = {signOut} className='w-4.5 text-gray-400 hover:text-gray-700 transition cursor-poinster'/>
        </div>
    </div>
  )
}

export default Sidebar
