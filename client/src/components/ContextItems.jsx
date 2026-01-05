import React from 'react'
import { contextMenuData } from '../assets/assets'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '@clerk/clerk-react'

const ContextItems = ({
  post,
  isOwner,
  closeMenu,
  type // "post" | "comment"
}) => {
  const { getToken } = useAuth()

  const handleAction = async (key) => {
    try {
      switch (key) {
        case 'save':
          toast.success('Post saved')
          break

        case 'not_interested':
          toast.success('We will show fewer posts like this')
          break

        case 'edit':
          toast('Edit feature coming soon')
          break

        case 'delete':
          if (type === 'post') {
            const { data } = await api.delete(`/api/post/${post._id}`, {
              headers: {
                Authorization: `Bearer ${await getToken()}`
              }
            })

            if (data.success) {
              toast.success('Post deleted')
            }
          }
          break

        default:
          break
      }

      closeMenu()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="px-2 py-1 text-gray-700 space-y-1 font-medium">
      {contextMenuData.map(({ id, label, Icon, allowFor, danger }) => {
        if (allowFor === 'owner' && !isOwner) return null

        return (
          <button
            key={id}
            onClick={() => handleAction(id)}
            className={`w-full px-4 py-2.5 flex items-center gap-3 rounded-lg
              hover:bg-gray-100 transition text-left
              ${danger ? 'text-red-600 hover:bg-red-50' : ''}
            `}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default ContextItems
