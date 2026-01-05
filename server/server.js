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


const app = express();

await connectDB();


// middlewares for our app
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware());

//API endpoints routes
app.get('/', (req,res)=> res.send('server is running'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)
app.use('/api/comment', commentRouter)


const PORT = process.env.PORT || 4000;

//to start our application
app.listen(PORT, () => console.log(`server is running on port ${PORT}`))
