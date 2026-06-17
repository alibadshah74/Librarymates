import React from 'react'
import { MapPin, MessageCircle, UserCheck, UserPlus, UserRound } from 'lucide-react'
import { useDispatch, useSelector} from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'


const UserCard = ({user}) => {

    const currentUser = useSelector((state)=> state.user.value)
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const isCurrentUser = currentUser?._id === user._id
    const isMate = currentUser?.following?.includes(user._id) || currentUser?.followers?.includes(user._id)
    const isPending = currentUser?.followingRequests?.includes(user._id)
    const hasIncomingRequest = currentUser?.mateRequests?.includes(user._id)

    const handleFollow = async () => {
        if (isCurrentUser || isMate || isPending) return

        try {
            const { data } = await api.post('/api/user/follow', {id: user._id},{
                headers:{ Authorization: `Bearer ${await getToken()}`}
            })
            if (data.success){
                toast.success(data.message)
                dispatch(fetchUser(await getToken()))
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.friendlyMessage || error.message)
        }
    }
  return (
    <div key={user._id} className='p-4 pt-6 flex min-h-72 w-full flex-col justify-between rounded-lg border border-gray-200 bg-white shadow-sm'>
        <div className='text-center'>
            <img src={user.profile_picture} alt="" className='rounded-full w-16 h-16 object-cover shadow-md mx-auto' />
            <p className='mt-4 font-semibold'>{user.full_name}</p>
            {user.username && <p className='text-gray-500 font-light'>@{user.username}</p>}
            {user.bio && <p className='text-gray-600 mt-2 text-center text-sm px-4 line-clamp-3'>{user.bio}</p>}
        </div>

        <div className='flex items-center justify-center gap-2 mt-4 text-xs text-gray-600'>
            {user.location && <div className='flex min-w-0 items-center gap-1 rounded-full border border-gray-300 px-3 py-1'>
                <MapPin className='w-4 h-4' /> {user.location}
            </div>}
            <div className='flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1'>
                <span>{user.followers?.length || 0}</span> Followers
            </div>
        </div>

        <div className='flex mt-4 gap-2'>
            {/* Follow Button  */}
            <button onClick={isCurrentUser ? () => navigate('/profile') : handleFollow} disabled={!isCurrentUser && (isMate || isPending)} className='w-full py-2 rounded-md flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer disabled:cursor-default disabled:opacity-70'>
                {isCurrentUser ? <UserRound className='w-4 h-4'/> : isMate ? <UserCheck className='w-4 h-4'/> : <UserPlus className='w-4 h-4'/>} {isCurrentUser ? 'View profile' : isMate ? 'Mate' : isPending ? 'Following' : hasIncomingRequest ? 'Accept' : 'Follow'}
            </button>
            {!isCurrentUser && isMate && (
                <button onClick={() => navigate('/messages/' + user._id)} className='flex items-center justify-center w-16 border text-slate-500 group rounded-md cursor-pointer active:scale-95 transition'>
                    <MessageCircle className='w-5 h-5 group-hover:scale-105 transition'/>
                </button>
            )}
        </div>
      
    </div>
  )
}

export default UserCard
