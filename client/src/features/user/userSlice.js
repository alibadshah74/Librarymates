import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'


const initialState = {
    value: null,
    loading: false,
    error: null
}

export const fetchUser =  createAsyncThunk('user/fetchUser', async ( token, { rejectWithValue } ) => {
    try {
        if (!token) return rejectWithValue('NO_TOKEN')
        const { data } = await api.get('/api/user/data', {
            headers: {Authorization: `Bearer ${token}`}
        })
        if (!data.success) return rejectWithValue(data.message || 'User not found')
        return data.user
    } catch (error) {
        return rejectWithValue(error.friendlyMessage || error.message)
    }
})

export const updateUser =  createAsyncThunk('user/update', async ( {userData, token}, { rejectWithValue } ) => {
    try {
        const { data } = await api.post('/api/user/update', userData, {
            headers: {Authorization: `Bearer ${token}`}
        })
        if(data.success){
            toast.success(data.message)
            return data.user
        }
        toast.error(data.message)
        return rejectWithValue(data.message || 'Unable to update profile')
    } catch (error) {
        const message = error.friendlyMessage || error.message
        toast.error(message)
        return rejectWithValue(message)
    }
})

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchUser.pending, (state)=>{
            state.loading = true
            state.error = null
        }).addCase(fetchUser.fulfilled, (state, action)=>{
            state.value = action.payload
            state.loading = false
            state.error = null
        }).addCase(fetchUser.rejected, (state, action)=>{
            state.value = null
            state.loading = false
            state.error = action.payload || action.error.message
        }).addCase(updateUser.fulfilled, (state, action)=>{
            state.value = action.payload
        })
    }
})

export default userSlice.reducer
