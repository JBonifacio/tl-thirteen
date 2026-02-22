import { Router, Request, Response } from 'express'
import db from '../db'
import { isCleanNickname } from '../middleware/profanity'

const router = Router()

/** Get today's date in Pacific time as YYYY-MM-DD */
function getTodayPacific(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Validate YYYY-MM-DD format */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

const NICKNAME_RE = /^[a-zA-Z0-9 _-]{3,16}$/
const CONSECUTIVE_SPACES_RE = /  /

interface ScoreBody {
  puzzleDate: string
  nickname: string
  position: number
  moves: number
  elapsedMs: number
  hintPenaltyMs: number
}

interface ScoreRow {
  nickname: string
  position: number
  moves: number
  elapsed_ms: number
  hint_penalty_ms: number
}

function getLeaderboard(puzzleDate: string) {
  return db.prepare(`
    SELECT nickname, position, moves, elapsed_ms, hint_penalty_ms
    FROM scores
    WHERE puzzle_date = ?
    ORDER BY position ASC, moves ASC, elapsed_ms ASC
  `).all(puzzleDate) as ScoreRow[]
}

function buildResponse(puzzleDate: string, nickname?: string) {
  const rows = getLeaderboard(puzzleDate)
  const scores = rows.map(r => ({
    nickname: r.nickname,
    position: r.position,
    moves: r.moves,
    elapsedMs: r.elapsed_ms,
    hintPenaltyMs: r.hint_penalty_ms,
  }))
  const yourRank = nickname
    ? scores.findIndex(s => s.nickname.toLowerCase() === nickname.toLowerCase()) + 1
    : 0
  return { scores, yourRank }
}

// POST /api/scores
router.post('/scores', (req: Request, res: Response) => {
  try {
    const body = req.body as ScoreBody

    // Validate puzzleDate
    if (!body.puzzleDate || !isValidDate(body.puzzleDate)) {
      res.status(400).json({ error: 'Invalid puzzleDate format (YYYY-MM-DD)' })
      return
    }
    if (body.puzzleDate !== getTodayPacific()) {
      res.status(400).json({ error: 'puzzleDate must be today (Pacific time)' })
      return
    }

    // Validate nickname
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''
    if (!NICKNAME_RE.test(nickname)) {
      res.status(400).json({ error: 'Nickname must be 3-16 chars: letters, numbers, spaces, hyphens, underscores' })
      return
    }
    if (CONSECUTIVE_SPACES_RE.test(nickname)) {
      res.status(400).json({ error: 'Nickname cannot contain consecutive spaces' })
      return
    }
    if (!isCleanNickname(nickname)) {
      res.status(400).json({ error: 'Please choose a different nickname' })
      return
    }

    // Validate numeric fields
    const position = Number(body.position)
    const moves = Number(body.moves)
    const elapsedMs = Number(body.elapsedMs)
    const hintPenaltyMs = Number(body.hintPenaltyMs) || 0

    if (!Number.isInteger(position) || position < 1 || position > 4) {
      res.status(400).json({ error: 'position must be 1-4' })
      return
    }
    if (!Number.isInteger(moves) || moves <= 0) {
      res.status(400).json({ error: 'moves must be > 0' })
      return
    }
    if (!Number.isInteger(elapsedMs) || elapsedMs < 0) {
      res.status(400).json({ error: 'elapsedMs must be >= 0' })
      return
    }
    if (!Number.isInteger(hintPenaltyMs) || hintPenaltyMs < 0) {
      res.status(400).json({ error: 'hintPenaltyMs must be >= 0' })
      return
    }

    // Insert or replace
    db.prepare(`
      INSERT INTO scores (puzzle_date, nickname, position, moves, elapsed_ms, hint_penalty_ms)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(puzzle_date, nickname COLLATE NOCASE) DO UPDATE SET
        position = excluded.position,
        moves = excluded.moves,
        elapsed_ms = excluded.elapsed_ms,
        hint_penalty_ms = excluded.hint_penalty_ms,
        created_at = datetime('now')
    `).run(body.puzzleDate, nickname, position, moves, elapsedMs, hintPenaltyMs)

    res.json(buildResponse(body.puzzleDate, nickname))
  } catch (err) {
    console.error('POST /api/scores error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/scores/:date
router.get('/scores/:date', (req: Request<{ date: string }>, res: Response) => {
  try {
    const { date } = req.params
    if (!isValidDate(date)) {
      res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD)' })
      return
    }
    res.json(buildResponse(date))
  } catch (err) {
    console.error('GET /api/scores/:date error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
