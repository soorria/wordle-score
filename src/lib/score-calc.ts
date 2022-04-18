import { createMemo } from 'solid-js'
import { AccessorRecord, PersonScore, ScoreRecord, ScoreRecordTuple, SingleDayScore } from '~/types'
import { minmax } from '~/utils/misc'
import { useLocalStorage } from '~/utils/use-local-storage'
import { getCurrentDayOffset } from './wordle-stuff'

export type ScoreAccessors = AccessorRecord<{
  score: PersonScore
  record: ScoreRecord
  recordArray: ScoreRecordTuple[]
}>
export type ScoreSetters = {
  setTodayScore(score: SingleDayScore): void
  setDayScore(day: number, score: SingleDayScore): void
  deleteDayScore(day: number): void
}
export const scores: SingleDayScore[] = [1, 2, 3, 4, 5, 6, 'X']

export const calculateCumulativeScores = (record: ScoreRecord): PersonScore => {
  const daysPlayed = Object.keys(record)
    .map(str => parseInt(str))
    .filter(n => !Number.isNaN(n))

  if (daysPlayed.length < 1) {
    return { score: 0, daysPlayed: 0, uncountedFails: 0 }
  }

  const [minDay, maxDay] = minmax(daysPlayed)
  let score = 0
  let uncountedFails = 0

  for (let i = minDay; i < maxDay + 1; ++i) {
    if (i in record) {
      const dayScore = record[i]

      if (dayScore === 'X') {
        uncountedFails++
      } else {
        score += Math.pow(3, uncountedFails) * dayScore
        uncountedFails = 0
      }
    } else {
      score *= 3
    }
  }

  return { score, daysPlayed: daysPlayed.length, uncountedFails }
}

export type ScoreRenderData = ReturnType<typeof personScoreToRenderData>
export const personScoreToRenderData = (record: PersonScore) => ({
  ...record,
  scorePerDay: Math.round((record.score / daysAccountedForInScore(record)) * 100) / 100,
})
const daysAccountedForInScore = (record: PersonScore): number => {
  const t = record.daysPlayed - record.uncountedFails
  if (t <= 0) return 1
  return t
}
