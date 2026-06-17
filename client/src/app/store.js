import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice.js'
import messagesReducer from '../features/messages/messagesSlice.js'

export const store = configureStore({
    reducer: {
        user: userReducer, 
        messages: messagesReducer
    }
})
