import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions} from './inngest/index.js'
import { serve } from 'inngest/express'
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/userRotes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import studyMaterialRouter from './routes/studyMaterialRoutes.js';


const app = express();

await connectDB();

const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

// middlewares for our app
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            return callback(null, true)
        }
        return callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: true,
}))
app.use((req, res, next) => {
    const startedAt = Date.now()
    res.on('finish', () => {
        const duration = Date.now() - startedAt
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
        console[level](`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
    })
    next()
})
app.use(clerkMiddleware());

//API endpoints routes
app.get('/', (req,res)=> res.send('server is running'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)
app.use('/api/comment', commentRouter)
app.use('/api/study-materials', studyMaterialRouter)
app.use('/api/study-material', studyMaterialRouter)

app.use((req, res) => {
    console.warn(`[${new Date().toISOString()}] Route not found: ${req.method} ${req.originalUrl}`)
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
})

app.use((error, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Unhandled error: ${req.method} ${req.originalUrl}`, error)
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    })
})

const PORT = process.env.PORT || 4000;

//to start our application
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`server is running on port ${PORT}`))
}

export default app
