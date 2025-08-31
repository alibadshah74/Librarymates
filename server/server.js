import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions} from './inngest/index.js'
import { serve } from 'inngest/express'
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/userRotes.js';


const app = express();

await connectDB();


// Middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware());

//Routes
app.get('/', (req,res)=> res.send('server is running'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)


const PORT = process.env.PORT || 4000;

//to start our application
app.listen(PORT, () => console.log(`server is running on port ${PORT}`))
