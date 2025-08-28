import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions} from './inngest/index.js'


const app = express();

await connectDB();

// Middleware
app.use(express.json())
app.use(cors())

//Routes
app.get('/', (req,res)=> res.send('server is running'))
app.use('/api/inngest', server({ client: inngest, functions }))


const PORT = process.env.PORT || 4000;

//to start our application
app.listen(PORT, () => console.log(`server is running on port ${PORT}`))
