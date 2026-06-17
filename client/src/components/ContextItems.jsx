import React from 'react'
import { contextMenuData } from '../assets/assets'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '@clerk/clerk-react'

const ContextItems = ({
  post,
  isOwner,
  closeMenu,
  onEditRequest,
  onDeleted
}) => {
  const { getToken } = useAuth()

  const downloadPost = () => {
    const lines = [
      post?.user?.full_name ? `Author: ${post.user.full_name}` : '',
      post?.createdAt ? `Posted: ${new Date(post.createdAt).toLocaleString()}` : '',
      '',
      post?.content || 'No text content',
      '',
      ...(post?.image_urls?.length ? ['Images:', ...post.image_urls] : [])
    ].filter(Boolean)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `librarymates-post-${post._id}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success('Post downloaded')
  }

  const handleAction = async (key) => {
    try {
      switch (key) {
        case 'download':
          downloadPost()
          break

        case 'edit':
          if (isOwner) onEditRequest?.()
          break

        case 'delete':
          if (isOwner && window.confirm('Delete this post? It will be hidden from Librarymates but kept in storage.')) {
            const { data } = await api.delete(`/api/post/${post._id}`, {
              headers: {
                Authorization: `Bearer ${await getToken()}`
              }
            })

            if (data.success) {
              toast.success('Post deleted')
              onDeleted?.()
            } else {
              toast.error(data.message)
            }
          }
          break

        default:
          break
      }

      closeMenu()
    } catch (error) {
      toast.error(error.friendlyMessage || error.message)
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
            {React.createElement(Icon, { className: 'w-5 h-5' })}
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default ContextItems
