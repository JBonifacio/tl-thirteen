import express from 'express'
import leaderboardRoutes from './routes/leaderboard'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(express.json())

app.use('/api', leaderboardRoutes)

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`)
})
