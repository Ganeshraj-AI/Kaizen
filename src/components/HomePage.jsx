import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { todayISO } from '../hooks/useStore'

const MOODS = [
  { value: 5, emoji: '🌟', label: 'Amazing' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 3, emoji: '😌', label: 'Okay' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 1, emoji: '😞', label: 'Hard' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Winding down'
}

function ProgressRing({ pct, size = 80, stroke = 4 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="progress-ring-wrap" style={{ width: size, height: size }}>
      <svg className="progress-ring-svg" width={size} height={size}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#7C5CBF" />
          </linearGradient>
        </defs>
        <circle className="progress-ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
        <circle className="progress-ring-fill" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{pct}%</div>
      </div>
    </div>
  )
}

// Generates warm, narrative emotional insights from real data
function generateEmotionalInsights(habits, completions, moods, sleepLogs, journalEntries) {
  const insights = []
  const today = todayISO()
  const todayDt = new Date()

  // Active days this week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDt); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
  const activeDays = weekDates.filter(d => habits.some(h => completions[`${h.id}_${d}`])).length

  if (activeDays >= 6) insights.push("You've shown up every day this week. That kind of consistency is rare — and worth noticing.")
  else if (activeDays >= 4) insights.push(`${activeDays} out of 7 days this week. Consistency isn't perfection — it's showing up more often than not.`)
  else if (activeDays >= 2) insights.push("You've been here. Even the quieter days matter — they're part of the rhythm too.")
  else if (activeDays === 1) insights.push("You returned. That's the only thing that ever really matters.")

  // Sleep + mood correlation
  if (sleepLogs.length >= 3 && moods.length >= 3) {
    const pairs = sleepLogs.slice(0, 14).map(s => {
      const m = moods.find(x => x.date === s.date)
      return m ? { sleep: s.hours, mood: m.mood } : null
    }).filter(Boolean)
    if (pairs.length >= 3) {
      const wellRested = pairs.filter(p => p.sleep >= 7.5)
      const avgWellRestedMood = wellRested.length
        ? wellRested.reduce((s, p) => s + p.mood, 0) / wellRested.length : 0
      if (avgWellRestedMood >= 3.5 && wellRested.length >= 2) {
        insights.push("You tend to feel more like yourself on days after restful sleep. Rest is never wasted time.")
      }
    }
  }

  // Journal + mood correlation
  if (journalEntries.length >= 3 && moods.length >= 3) {
    const journalDates = journalEntries.map(e => e.date)
    const journalMoods = moods.filter(m => journalDates.includes(m.date))
    const avgJournalMood = journalMoods.length
      ? journalMoods.reduce((s, m) => s + m.mood, 0) / journalMoods.length : 0
    if (avgJournalMood >= 3.5) {
      insights.push("Your mood scores are noticeably warmer on days you take time to write. Words are a form of care.")
    }
  }

  // Habit + mood
  if (habits.length >= 2 && moods.length >= 5) {
    const moodHabitPairs = moods.slice(0, 30).map(m => ({
      mood: m.mood,
      done: habits.filter(h => completions[`${h.id}_${m.date}`]).length
    })).filter(p => p.done > 0)

    const consistentDays = moodHabitPairs.filter(p => p.done >= habits.length * 0.6)
    const avgMoodConsistent = consistentDays.length
      ? consistentDays.reduce((s, p) => s + p.mood, 0) / consistentDays.length : 0

    if (avgMoodConsistent >= 3.8 && consistentDays.length >= 3) {
      insights.push("There's a quiet correlation between your habits and your sense of calm. Your rituals are working, even when it doesn't feel that way.")
    }
  }

  // Journaling streak encouragement
  if (journalEntries.length >= 5) {
    const recent = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayDt); d.setDate(d.getDate() - i)
      return d.toISOString().slice(0, 10)
    })
    const recentJournaled = recent.filter(d => journalEntries.some(e => e.date === d)).length
    if (recentJournaled >= 4) {
      insights.push("Writing regularly is one of the most underrated forms of self-care. You've been doing it.")
    }
  }

  // Gentle fallback
  if (insights.length === 0) {
    const fallbacks = [
      "Growth happens in the small moments. You're here — that's enough.",
      "You don't have to be consistent to be worthy. But showing up helps.",
      "Start where you are. Use what you have. Do what you can.",
    ]
    const day = new Date().getDay()
    insights.push(fallbacks[day % fallbacks.length])
  }

  return insights.slice(0, 2)
}

export default function HomePage({
  user, habits, completions, moods, sleepLogs, journalEntries,
  getOverallStreak, getWeeklyCompletionRate, getTodayRate, getInsights,
  onNavigate, toggleCompletion,
}) {
  const today = todayISO()
  const greeting = getGreeting()
  const userName = user?.user_metadata?.name || user?.name || user?.email?.split('@')[0] || 'you'
  const firstName = userName.split(' ')[0]

  const { current: streak } = getOverallStreak()
  const weekRate = getWeeklyCompletionRate()
  const todayRate = getTodayRate()

  const todayMood = moods.find(m => m.date === today)
  const todayMoodObj = MOODS.find(m => m.value === todayMood?.mood)
  const lastSleep = sleepLogs[0]
  const todayJournal = journalEntries.find(e => e.date === today)

  const todayHabits = useMemo(() => habits.map(h => ({
    ...h, done: Boolean(completions[`${h.id}_${today}`])
  })), [habits, completions, today])
  const doneCount = todayHabits.filter(h => h.done).length

  const emotionalInsights = useMemo(() =>
    generateEmotionalInsights(habits, completions, moods, sleepLogs, journalEntries),
    [habits, completions, moods, sleepLogs, journalEntries]
  )

  // Compassionate streak message — not a metric, a feeling
  const rhythmMessage = (() => {
    if (streak === 0 && doneCount > 0) return "Today is a fresh start."
    if (streak === 0) return "Every day is a new invitation."
    if (streak < 4) return `${streak} days in a row — you're finding your rhythm.`
    if (streak < 10) return `${streak} days. Something is taking root.`
    if (streak < 30) return `${streak} days of returning. This is who you're becoming.`
    return `${streak} days. You've made this part of your life.`
  })()

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── HERO — open, editorial, no box ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          paddingBottom: 32,
          borderBottom: '1px solid rgba(232,227,244,0.4)',
          marginBottom: 36,
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 500 }}>
            {dateStr}
          </p>
          <h2 className="font-display" style={{ fontSize: 'clamp(30px, 4vw, 46px)', color: 'var(--color-text-primary)', lineHeight: 1.1, marginBottom: 10, letterSpacing: '-0.8px' }}>
            {greeting},<br />{firstName}.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-display)', marginBottom: 20 }}>
            {rhythmMessage}
          </p>

          {/* Week rhythm — pill bars */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i))
              const iso = d.toISOString().slice(0, 10)
              const anyDone = habits.some(h => completions[`${h.id}_${iso}`])
              const isToday = iso === today
              return (
                <div key={iso} style={{ width: isToday ? 28 : 7, height: 4, borderRadius: 99, transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', background: anyDone ? 'var(--color-purple)' : 'var(--color-border)', opacity: isToday ? 1 : anyDone ? 0.65 : 0.28 }} />
              )
            })}
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>this week</span>
          </div>
        </div>

        {habits.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ProgressRing pct={todayRate} />
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {doneCount} of {habits.length} today
            </p>
          </div>
        )}
      </motion.section>

      {/* ── TWO COLUMN BODY ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 items-start">

        {/* LEFT: Rituals + Emotional Insight Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>

          {/* Today's rituals */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 className="font-display" style={{ fontSize: 19, letterSpacing: '-0.2px', color: 'var(--color-text-primary)' }}>
              Today's rituals
            </h3>
            <button onClick={() => onNavigate('tracker')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-purple)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 3 }}>
              Full view <ChevronRight size={12} />
            </button>
          </div>

          {habits.length === 0 ? (
            <div style={{ padding: '24px 0 32px' }}>
              <p className="font-display" style={{ fontSize: 16, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 8 }}>Your space is ready.</p>
              <button onClick={() => onNavigate('tracker')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-purple)', fontSize: 13, fontFamily: 'var(--font-body)', padding: 0, textDecoration: 'underline', textDecorationColor: 'rgba(124,92,191,0.3)' }}>
                Begin with one small ritual →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {todayHabits.map((h, idx) => (
                <motion.div key={h.id}>
                  <motion.div
                    onClick={() => toggleCompletion(h.id, today)}
                    whileTap={{ scale: 0.99 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 6px', cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                  >
                    {/* Soft check circle */}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: h.done ? h.color : 'transparent',
                      border: `1.5px solid ${h.done ? 'transparent' : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white', fontWeight: 700,
                      boxShadow: h.done ? `0 2px 10px ${h.color}45` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                      {h.done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.color, opacity: 0.5, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: h.done ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: h.done ? 'line-through' : 'none', textDecorationColor: 'rgba(155,147,184,0.4)', transition: 'all 0.2s ease' }}>
                      {h.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h.category}</span>
                  </motion.div>
                  {idx < todayHabits.length - 1 && <div style={{ height: 1, background: 'var(--color-border)', opacity: 0.35, margin: '0 6px' }} />}
                </motion.div>
              ))}

              {doneCount === habits.length && habits.length > 0 && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="font-display" style={{ marginTop: 16, fontSize: 14, fontStyle: 'italic', color: 'var(--color-sage)' }}>
                  All done. You showed up today.
                </motion.p>
              )}
            </div>
          )}

          {/* ── Emotional insight card — main feature ── */}
          {emotionalInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="insight-card"
              style={{ marginTop: 36 }}
            >
              <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-purple)', fontWeight: 600, marginBottom: 12, opacity: 0.8 }}>
                A pattern worth noticing
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {emotionalInsights.map((ins, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, fontFamily: i === 0 ? 'var(--font-display)' : 'var(--font-body)', fontStyle: i === 0 ? 'italic' : 'normal', fontSize: i === 0 ? 15 : 13 }}>
                    {ins}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* Daily reflection prompt */}
          {!todayJournal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              style={{ marginTop: 28 }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg, var(--color-border) 0%, transparent 100%)', marginBottom: 20 }} />
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Reflection prompt</p>
              <p className="font-display" style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 12 }}>
                {[
                  "What would make today feel complete?",
                  "What's one thing you want to carry gently today?",
                  "What does showing up look like for you today?",
                  "What are you grateful for, right now?",
                  "What would feel like enough today?",
                  "How are you, really?",
                  "What needs the most care in you today?",
                ][new Date().getDay()]}
              </p>
              <button onClick={() => onNavigate('journal')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-purple)', fontSize: 13, fontFamily: 'var(--font-body)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                Write in your journal <ChevronRight size={12} />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT: Soft data sidebar */}
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Mood + Sleep — minimal, stitched grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(232,227,244,0.5)', background: 'white' }}>
            {[
              { label: 'Mood today', value: todayMoodObj?.emoji, sub: todayMoodObj?.label || 'not logged', action: () => onNavigate('mood') },
              { label: 'Last night', value: lastSleep?.hours ? `${lastSleep.hours}h` : '—', sub: lastSleep?.hours >= 7.5 ? 'restful' : lastSleep?.hours ? 'lighter' : 'not logged', action: () => onNavigate('sleep') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ padding: '16px 18px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderRight: i === 0 ? '1px solid rgba(232,227,244,0.5)' : 'none', fontFamily: 'var(--font-body)', transition: 'background 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-lavender)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</p>
                <p style={{ fontSize: item.value?.length > 2 ? 18 : 22, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 4 }}>{item.value || '—'}</p>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{item.sub}</p>
              </button>
            ))}
          </div>

          {/* Streak — not gamified, just a quiet rhythm indicator */}
          <div style={{ padding: '16px 18px', background: 'rgba(245,243,255,0.6)', borderRadius: 14, border: '1px solid rgba(196,181,253,0.25)' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your rhythm</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="font-display" style={{ fontSize: 32, color: 'var(--color-purple)', lineHeight: 1 }}>{streak}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>days in a row</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
              {weekRate}% of this week's rituals completed
            </p>
          </div>

          {/* 7-day mood trail */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>Emotional trail</p>
              <button onClick={() => onNavigate('mood')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-purple)', fontFamily: 'var(--font-body)' }}>Log →</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i))
                const iso = d.toISOString().slice(0, 10)
                const m = moods.find(x => x.date === iso)
                const obj = MOODS.find(x => x.value === m?.mood)
                const isT = iso === today
                return (
                  <div key={iso} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: obj ? 17 : 14, opacity: obj ? 1 : 0.14, marginBottom: 4 }}>{obj?.emoji || '·'}</div>
                    <div style={{ fontSize: 8, color: isT ? 'var(--color-purple)' : 'var(--color-text-muted)', fontWeight: isT ? 600 : 400 }}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Journal teaser */}
          <div style={{ borderTop: '1px solid rgba(232,227,244,0.4)', paddingTop: 20 }}>
            <button onClick={() => onNavigate('journal')} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Journal</span>
                <span style={{ fontSize: 11, color: 'var(--color-purple)' }}>Open →</span>
              </div>
              {todayJournal ? (
                <div>
                  {todayJournal.title && <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{todayJournal.title}</p>}
                  {todayJournal.reflection && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
                      "{todayJournal.reflection}"
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-display" style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Today's page is blank.</p>
              )}
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 8 }}>
                {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'} written
              </p>
            </button>
          </div>
        </motion.div>
      </div>


    </div>
  )
}
