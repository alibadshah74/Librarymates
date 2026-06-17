import React, { useState } from 'react'
import  Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = () => {

  const { value: user, loading, error } = useSelector((state) =>state.user)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return <Loading/>

  if (error) {
    return (
      <div className='flex h-screen items-center justify-center bg-slate-50 p-6'>
        <div className='max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>Could not load your profile</h1>
          <p className='mt-2 text-sm text-slate-600'>{error}</p>
          <p className='mt-3 text-xs text-slate-400'>Please restart the server and refresh after the database connection is corrected.</p>
        </div>
      </div>
    )
  }

  return user ? (
    <div className='flex h-screen w-full overflow-hidden'>
      <Sidebar sidebarOpen = {sidebarOpen} setSidebarOpen ={setSidebarOpen}/>
        <div className='min-w-0 flex-1 overflow-y-auto bg-slate-50'>
          <Outlet/>
        </div>
        {
          sidebarOpen ?
          <X className='fixed top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-grey-600 sm:hidden' onClick ={()=> setSidebarOpen(false)}/>
          : 
          <Menu className='fixed top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-grey-600 sm:hidden' onClick ={()=> setSidebarOpen(true)}/>
        }
    </div>
  ) :(
    <Loading/>
  )
}

export default Layout
