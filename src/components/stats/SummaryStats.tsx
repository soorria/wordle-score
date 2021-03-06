import { Component, createMemo, For, JSXElement } from 'solid-js'
import { getClassesForScore } from '~/lib/colors'
import { scores } from '~/lib/score-calc'
import { useSettings } from '~/lib/settings'
import { ScoreRecordTuple, SingleDayScore } from '~/types'
import { formatScoreNumber, jsxJoin, minmax, plural, sum } from '~/utils/misc'
import StatsSectionWrapper from './StatsSectionWrapper'

const FAIL_NUMBER = 7
const scoreToNumber = (s: SingleDayScore): number => (typeof s === 'number' ? s : FAIL_NUMBER)
const numberToScore = (n: number): SingleDayScore => (n >= 0 && n <= 6 ? n : 'X') as SingleDayScore

const mu = 'μ'
const sigma = 'σ'
const gamma = 'γ'
const kappa = 'κ'

const SummaryStats: Component<{ records: ScoreRecordTuple[] }> = props => {
  const [settings] = useSettings()

  const counts = createMemo(() => {
    const results = Object.fromEntries(scores.map(s => [s, 0] as const)) as Record<
      SingleDayScore,
      number
    >
    props.records.forEach(([_, score]) => {
      results[score]++
    })
    return scores.map(s => [s, results[s]] as const)
  })

  const summary = createMemo(() => {
    const days = props.records.map(([d]) => d)
    const daysPlayed = days.length
    const [minDay, maxDay] = minmax(days)
    const dayScores = props.records.map(([_, s]) => scoreToNumber(s))
    const [min, max] = minmax(dayScores)
      .map(n => numberToScore(n))
      .map(s => <span class={getClassesForScore(s)}>{s}</span>)

    const nDays = dayScores.length

    const countsSortedByCountDesc = counts().sort(([_, a], [__, b]) => b - a)
    const modes = countsSortedByCountDesc
      .filter(([_, c]) => c === countsSortedByCountDesc[0]![1])
      .map(([s, _]) => s)

    const total = sum(dayScores)
    const mean = total / nDays
    const median = (() => {
      const sorted = [...dayScores].sort((a, b) => a - b)
      if (sorted.length % 2 === 1) {
        return sorted[(sorted.length - 1) / 2]!
      }
      const mid = sorted.length / 2
      return (sorted[mid - 1]! + sorted[mid]!) / 2
    })()

    const variance = sum(dayScores.map(s => Math.pow(s - mean, 2))) / nDays
    const standardDeviation = Math.sqrt(variance)

    const skewness = sum(dayScores.map(s => Math.pow((s - mean) / standardDeviation, 3))) / nDays
    const kurtosis = sum(dayScores.map(s => Math.pow((s - mean) / standardDeviation, 4))) / nDays

    const formatFloats = (n: number) =>
      formatScoreNumber(n, {
        truncateMax: 0,
        shortenBigNumbers: settings.shortenBigNumbers,
      })

    const withColorFormatted = (n: number | string) => (
      <span class={getClassesForScore(n)}>{typeof n === 'string' ? n : formatFloats(n)}</span>
    )

    const result: [JSXElement, JSXElement][] = [
      [`Mean, ${mu}`, withColorFormatted(mean)],
      ['Median', withColorFormatted(median)],
      [
        plural(modes.length, 'Mode', 'Modes'),
        jsxJoin(
          modes.map(n => withColorFormatted(n)),
          () => ','
        ),
      ],
      ['Minimum', min],
      ['Maximum', max],
      ['First Day Played', minDay],
      ['Last Day Played', maxDay],
      ['Days Played', daysPlayed],
      [
        <>
          Variance, {sigma}
          <sup>2</sup>
        </>,
        formatFloats(variance),
      ],
      [`Standard Deviation, ${sigma}`, formatFloats(standardDeviation)],
      [`Skewness, ${gamma}`, formatFloats(skewness)],
      [`Kurtosis, ${kappa}`, formatFloats(kurtosis)],
      ['Total', total],
    ]

    return result
  })

  return (
    <StatsSectionWrapper title="Summary Stats">
      <table class="stat-table w-full table-fixed text-base">
        <thead>
          <tr>
            <th>Stat</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <For each={summary()}>
            {([stat, value]) => (
              <tr>
                <td>{stat}</td>
                <td class="font-mono">{value}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <p class="text-sm">
        For simplicity, <code>X</code>'s are treated as a <code>{FAIL_NUMBER}</code>, and missed
        days are ignored
      </p>
    </StatsSectionWrapper>
  )
}

export default SummaryStats
