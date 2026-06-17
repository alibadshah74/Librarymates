import React from 'react'
import ContextItems from './ContextItems'

const Contextbar = ({contextbarOpen, setContextbarOpen, post, isOwner, type, onEditRequest, onDeleted}) => {

  return (
    <div className={`absolute right-0 top-12 z-100
        w-56 bg-white rounded-xl shadow-xl 
        origin-top-right
        transition-all duration-200 ease-out
        ${contextbarOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}>
      <div className='max-h-72 overflow-y-auto py-1'>
            <ContextItems
              post={post}
              isOwner={isOwner}
              type={type}
              closeMenu={() => setContextbarOpen(false)}
              onEditRequest={onEditRequest}
              onDeleted={onDeleted}
            />
      </div>
    </div>
  )
}

export default Contextbar
