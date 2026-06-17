import { createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import api from '../../api/axios'


const initialState = {
    messages: []
}

export const  fetchMessages = createAsyncThunk('messages/fetchMessages', async ({token, userId}, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/api/message/get', {to_user_id: userId}, {
            headers: { Authorization: `Bearer ${token}`}
        })
        if (!data.success) return rejectWithValue(data.message || 'Unable to load messages')
        return data
    } catch (error) {
        return rejectWithValue(error.friendlyMessage || error.message)
    }
})

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action)=>{
            state.messages = action.payload;
        },
        addMessage: (state, action)=>{
            state.messages = [...state.messages, action.payload];
        },
        resetMessages: (state)=>{
            state.messages = [];
        },
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchMessages.fulfilled, (state, action)=>{
            if(action.payload){
                state.messages = action.payload.messages
            }
        })
    }
})

export const { setMessages, addMessage, resetMessages } = messagesSlice.actions;

export default messagesSlice.reducer
