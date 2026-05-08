import { motion } from 'framer-motion'
import { todayISO } from '../hooks/useStore'

const REFLECTIONS = [
  'Progress, not perfection.',
  'Every return matters.',
  'Slow is still moving.',
  'You are not behind.',
  'Small steps are still steps.',
  'Rest is part of the work.',
  'You showed up. That\'s enough.',
]

export default function StatsBar({ habits, completions, getOverallStreak, getWeeklyCompletionRate, getTodayRate }) {
  const { current: streak } = getOverallStreak()
  const weeklyRate = getWeeklyCompletionRate()
  const todayRate = getTodayRate()
  const today = todayISO()
  const todayDone = habits.filter(h => completions[`${h.id}_${today}`]).length

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const reflection = REFLECTIONS[dayOfYear % REFLECTIONS.length]

  // Human-readable rhythm, not a metric
  const rhythmNote = (() => {
    if (streak === 0 && todayDone === 0) return 'Every day is a new invitation.'
    if (streak === 0 && todayDone > 0) return 'You\'re beginning again today.'
    if (streak < 4) return `${streak} days in a row — something is building.`
    if (streak < 14) return `${streak} days. A quiet rhythm is forming.`
    return `${streak} days of returning. This is becoming part of you.`
  })()

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Reflection strip — no icon, just a soft sentence */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', marginBottom: 14,
          background: 'linear-gradient(90deg, rgba(124,92,191,0.05) 0%, transparent 100%)',
          borderRadius: 11, borderLeft: '2px solid rgba(196,181,253,0.5)',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
          {reflection}
        </span>
        {habits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
            <div className="progress-bar" style={{ width: 60 }}>
              <div className="progress-fill" style={{ width: `${todayRate}%` }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-purple)', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {todayDone}/{habits.length} today
            </span>
          </div>
        )}
      </motion.div>

      {/* Summary — two gentle stats, no icon overload */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          style={{ flex: '2 1 180px', padding: '12px 16px', background: 'rgba(245,243,255,0.5)', borderRadius: 12, border: '1px solid rgba(196,181,253,0.2)' }}
        >
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Your rhythm</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{rhythmNote}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ flex: '1 1 120px', padding: '12px 16px', background: 'rgba(240,247,241,0.5)', borderRadius: 12, border: '1px solid rgba(107,155,115,0.2)' }}
        >
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>This week</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: weeklyRate >= 70 ? '#6B9B73' : 'var(--color-text-primary)', lineHeight: 1 }}>
            {weeklyRate}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 1 }}>%</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {weeklyRate >= 80 ? 'in flow' : weeklyRate >= 50 ? 'consistent' : weeklyRate > 0 ? 'building' : 'begin again'}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
