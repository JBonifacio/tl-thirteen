import { create } from 'zustand'
import { Card } from '../game/cards'
import { Move, isValidPlay } from '../game/moves'
import { getDailyDeal, Hand } from '../game/deal'
import { TellDefinition, assignBotTells } from '../game/tells'
import { decideBotMove, isRoundOver, findLeaderAfterWin, getNextActivePlayer } from '../game/bot'
import { getPuzzleDate, getPuzzleNumber, isPuzzleExpired } from '../game/puzzle'
import {
  markStarted,
  hasStarted,
  saveResult,
  loadResult,
  resolveTells,
} from '../game/session'

const BOT_DELAY_MS = 900

export type GamePhase = 'begin' | 'playing' | 'finished' | 'already_played'

export interface GameStore {
  // meta
  puzzleDate: string
  puzzleNumber: number
  isExpired: boolean

  // game phase
  phase: GamePhase

  // cards
  hands: [Hand, Hand, Hand, Hand]

  // turn state
  currentPlayer: number
  currentTrick: Move | null
  roundLeader: number
  lastPlayedBy: number
  passedThisRound: number[]

  // finish tracking
  finishOrder: number[]
  startTime: number | null
  playerEndTime: number | null
  playerMoveCount: number
  playerFinishPosition: number | null

  // tells
  botTells: [TellDefinition[], TellDefinition[], TellDefinition[]]
  tellObservations: number[][]
  confirmedTells: Set<string>[]

  // hint penalty
  hintPenaltyMs: number

  // actions
  initGame: () => void
  startGame: () => void
  playerPlay: (cards: Card[]) => void
  playerPass: () => void
  revealHint: (botOffset: number) => void

  // internal
  _executeBotTurn: (seat: number) => void
  _scheduleBotTurn: (seat: number, delay?: number) => void
  _applyPlay: (seat: number, move: Move) => void
  _applyPass: (seat: number) => void
  _advanceAfterAction: (seat: number) => void
}

function removeCards(hand: Hand, played: Card[]): Hand {
  const ids = new Set(played.map(c => c.id))
  return hand.filter(c => !ids.has(c.id))
}

export const useGameStore = create<GameStore>((set, get) => ({
  puzzleDate: '',
  puzzleNumber: 1,
  isExpired: false,
  phase: 'begin',
  hands: [[], [], [], []],
  currentPlayer: 0,
  currentTrick: null,
  roundLeader: 0,
  lastPlayedBy: 0,
  passedThisRound: [],
  finishOrder: [],
  startTime: null,
  playerEndTime: null,
  playerMoveCount: 0,
  playerFinishPosition: null,
  botTells: [[], [], []],
  tellObservations: [[], [], []],
  confirmedTells: [new Set(), new Set(), new Set()],
  hintPenaltyMs: 0,

  initGame: () => {
    const puzzleDate = getPuzzleDate()
    const puzzleNumber = getPuzzleNumber(puzzleDate)
    const isExpired = isPuzzleExpired(puzzleDate)

    // Always compute the deal + tells (needed whether we restore or play fresh)
    const { hands, startingPlayer } = getDailyDeal(puzzleDate)
    const botTells = assignBotTells(puzzleDate)

    // ── Check for a completed session from today ────────────────────────────
    const stored = loadResult(puzzleDate)
    if (stored) {
      // Restore just enough state for ResultsModal to render correctly.
      // startTime=0 + playerEndTime=elapsedMs means playerEndTime - startTime === elapsedMs.
      const restoredTells: [TellDefinition[], TellDefinition[], TellDefinition[]] = [
        resolveTells(stored.botTellIds[0]),
        resolveTells(stored.botTellIds[1]),
        resolveTells(stored.botTellIds[2]),
      ]
      set({
        puzzleDate,
        puzzleNumber,
        isExpired,
        phase: 'finished',
        hands: [[], [], [], []],
        botTells: restoredTells,
        confirmedTells: [
          new Set(stored.confirmedTellIds[0]),
          new Set(stored.confirmedTellIds[1]),
          new Set(stored.confirmedTellIds[2]),
        ],
        startTime: 0,
        playerEndTime: stored.elapsedMs,
        playerMoveCount: stored.playerMoveCount,
        playerFinishPosition: stored.playerFinishPosition,
        hintPenaltyMs: stored.hintPenaltyMs,
        tellObservations: [[], [], []],
        currentPlayer: 0,
        currentTrick: null,
        roundLeader: startingPlayer,
        lastPlayedBy: startingPlayer,
        passedThisRound: [],
        finishOrder: [],
      })
      return
    }

    // ── Started but not finished — block a second attempt ─────────────────
    if (hasStarted(puzzleDate)) {
      set({
        puzzleDate,
        puzzleNumber,
        isExpired,
        phase: 'already_played',
        hands,
        botTells,
        tellObservations: [
          new Array(botTells[0].length).fill(0),
          new Array(botTells[1].length).fill(0),
          new Array(botTells[2].length).fill(0),
        ],
        confirmedTells: [new Set(), new Set(), new Set()],
        currentPlayer: startingPlayer,
        currentTrick: null,
        roundLeader: startingPlayer,
        lastPlayedBy: startingPlayer,
        passedThisRound: [],
        finishOrder: [],
        startTime: null,
        playerEndTime: null,
        playerMoveCount: 0,
        playerFinishPosition: null,
        hintPenaltyMs: 0,
      })
      return
    }

    // ── Fresh game ────────────────────────────────────────────────────────
    set({
      puzzleDate,
      puzzleNumber,
      isExpired,
      phase: 'begin',
      hands,
      currentPlayer: startingPlayer,
      currentTrick: null,
      roundLeader: startingPlayer,
      lastPlayedBy: startingPlayer,
      passedThisRound: [],
      finishOrder: [],
      startTime: null,
      playerEndTime: null,
      playerMoveCount: 0,
      playerFinishPosition: null,
      botTells,
      tellObservations: [
        new Array(botTells[0].length).fill(0),
        new Array(botTells[1].length).fill(0),
        new Array(botTells[2].length).fill(0),
      ],
      confirmedTells: [new Set(), new Set(), new Set()],
      hintPenaltyMs: 0,
    })
  },

  startGame: () => {
    markStarted(get().puzzleDate)
    set({ phase: 'playing' })
    const { currentPlayer } = get()
    if (currentPlayer !== 0) {
      get()._scheduleBotTurn(currentPlayer)
    }
  },

  playerPlay: (cards) => {
    const state = get()
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return
    const type = isValidPlay(cards, state.currentTrick)
    if (!type) return
    get()._applyPlay(0, { type, cards })
  },

  playerPass: () => {
    const state = get()
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return
    if (!state.currentTrick) return
    get()._applyPass(0)
  },

  revealHint: (botOffset) => {
    const state = get()
    const tells = state.botTells[botOffset]
    const confirmed = state.confirmedTells[botOffset]
    const unconfirmed = tells.filter(t => !confirmed.has(t.id))
    if (unconfirmed.length === 0) return

    const newConfirmed = state.confirmedTells.map((s, i) => {
      if (i !== botOffset) return s
      const next = new Set(s)
      next.add(unconfirmed[0].id)
      return next
    })
    set({
      confirmedTells: newConfirmed as [Set<string>, Set<string>, Set<string>],
      hintPenaltyMs: state.hintPenaltyMs + 60_000,
    })
  },

  _applyPlay: (seat, move) => {
    const state = get()
    const newHands = state.hands.map((h, i) =>
      i === seat ? removeCards(h, move.cards) : [...h],
    ) as [Hand, Hand, Hand, Hand]

    const now = Date.now()
    const startTime = state.startTime ?? now
    const playerMoveCount = seat === 0 ? state.playerMoveCount + 1 : state.playerMoveCount

    const justFinished = newHands[seat].length === 0
    const finishOrder = justFinished ? [...state.finishOrder, seat] : [...state.finishOrder]

    let playerEndTime = state.playerEndTime
    let playerFinishPosition = state.playerFinishPosition

    if (justFinished && seat === 0 && playerEndTime === null) {
      playerEndTime = now
      playerFinishPosition = finishOrder.indexOf(0) + 1

      // Persist result to localStorage
      saveResult(state.puzzleDate, {
        playerFinishPosition,
        elapsedMs: playerEndTime - startTime,
        playerMoveCount,
        hintPenaltyMs: state.hintPenaltyMs,
        botTellIds: state.botTells.map(tells => tells.map(t => t.id)) as [string[], string[], string[]],
        confirmedTellIds: state.confirmedTells.map(s => [...s]) as [string[], string[], string[]],
      })
    }

    set({
      hands: newHands,
      currentTrick: move,
      lastPlayedBy: seat,
      passedThisRound: [],
      startTime,
      playerMoveCount,
      finishOrder,
      playerEndTime,
      playerFinishPosition,
    })

    const activeRemaining = newHands.filter(h => h.length > 0).length
    if (activeRemaining <= 1 || (seat === 0 && justFinished)) {
      if (activeRemaining <= 1) {
        const missing = [0, 1, 2, 3].filter(i => !finishOrder.includes(i))
        set({ finishOrder: [...finishOrder, ...missing], phase: 'finished' })
        return
      }
      set({ phase: 'finished' })
      return
    }

    get()._advanceAfterAction(seat)
  },

  _applyPass: (seat) => {
    const state = get()
    const newPassed = [...state.passedThisRound, seat]
    set({ passedThisRound: newPassed })

    if (isRoundOver(state.lastPlayedBy, state.hands, newPassed)) {
      const newLeader = findLeaderAfterWin(state.lastPlayedBy, state.hands)
      set({ currentTrick: null, roundLeader: newLeader, passedThisRound: [], currentPlayer: newLeader })
      if (newLeader !== 0) get()._scheduleBotTurn(newLeader)
      return
    }

    get()._advanceAfterAction(seat)
  },

  _advanceAfterAction: (seat) => {
    const state = get()
    const next = getNextActivePlayer(seat, state.hands, state.passedThisRound)

    if (next === -1) {
      const newLeader = findLeaderAfterWin(state.lastPlayedBy, state.hands)
      set({ currentTrick: null, roundLeader: newLeader, passedThisRound: [], currentPlayer: newLeader })
      if (newLeader !== 0) get()._scheduleBotTurn(newLeader)
      return
    }

    set({ currentPlayer: next })
    if (next !== 0) get()._scheduleBotTurn(next)
  },

  _scheduleBotTurn: (seat, delay = BOT_DELAY_MS) => {
    setTimeout(() => {
      const state = get()
      if (state.phase !== 'playing') return
      if (state.currentPlayer !== seat) return
      state._executeBotTurn(seat)
    }, delay)
  },

  _executeBotTurn: (seat) => {
    const state = get()
    if (state.phase !== 'playing' || state.currentPlayer !== seat || seat === 0) return

    const botOffset = seat - 1
    const hand = state.hands[seat]
    const tells = state.botTells[botOffset]

    const { chosen, triggeredIds } = decideBotMove(hand, tells, { currentTrick: state.currentTrick })

    const newObservations = state.tellObservations.map((obs, bi) => {
      if (bi !== botOffset) return obs
      return tells.map((tell, ti) => (triggeredIds.includes(tell.id) ? obs[ti] + 1 : obs[ti]))
    })

    const newConfirmed = state.confirmedTells.map((confirmed, bi) => {
      if (bi !== botOffset) return confirmed
      const next = new Set(confirmed)
      tells.forEach((tell, ti) => {
        if (newObservations[bi][ti] >= tell.confirmThreshold) next.add(tell.id)
      })
      return next
    })

    set({
      tellObservations: newObservations as number[][],
      confirmedTells: newConfirmed as [Set<string>, Set<string>, Set<string>],
    })

    if (!chosen) get()._applyPass(seat)
    else get()._applyPlay(seat, chosen)
  },
}))
