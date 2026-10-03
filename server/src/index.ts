import express from 'express'
import rateLimit from 'express-rate-limit'
import leaderboardRoutes from './routes/leaderboard'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', apiLimiter, leaderboardRoutes)

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})
