import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'leaderboard.db')

const args = process.argv.slice(2)

function usage() {
  console.log('Usage:')
  console.log('  npx tsx scripts/purge.ts --days 30   # delete scores older than 30 days')
  console.log('  npx tsx scripts/purge.ts --all        # delete everything')
  process.exit(1)
}

if (args.length === 0) usage()

const db = new Database(DB_PATH)

if (args[0] === '--all') {
  const result = db.prepare('DELETE FROM scores').run()
  console.log(`Deleted all ${result.changes} scores.`)
} else if (args[0] === '--days') {
  const days = parseInt(args[1], 10)
  if (!days || days <= 0) {
    console.error('Error: --days requires a positive number')
    process.exit(1)
  }
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const result = db.prepare('DELETE FROM scores WHERE puzzle_date < ?').run(cutoffStr)
  console.log(`Deleted ${result.changes} scores older than ${cutoffStr} (${days} days).`)
} else {
  usage()
}

db.close()
