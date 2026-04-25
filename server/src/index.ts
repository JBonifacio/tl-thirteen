import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import leaderboardRoutes from './routes/leaderboard'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// Trust proxy for rate limiting (behind Nginx/Cloudflare)
app.set('trust proxy', 1)

// Security headers
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
})

app.use('/api', limiter)
app.use(express.json({ limit: '10kb' }))

app.use('/api', leaderboardRoutes)

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})
