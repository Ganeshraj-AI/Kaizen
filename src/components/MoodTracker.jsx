import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { todayISO, formatDate } from '../hooks/useStore'

const MOODS = [
  { value: 5, emoji: '🌟', label: 'Amazing', color: '#A78BFA' },
  { value: 4, emoji: '😊', label: 'Good', color: '#6EE7B7' },
  { value: 3, emoji: '😌', label: 'Okay', color: '#7DD3FC' },
  { value: 2, emoji: '😔', label: 'Low', color: '#FCD34D' },
  { value: 1, emoji: '😞', label: 'Hard', color: '#FCA5A5' },
]

function MoodAreaChart({ data, width = 340, height = 72 }) {
  // data: [{ mood: number|null }] length 14
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: d.mood ? height - ((d.mood - 1) / 4) * (height - 12) - 6 : null,
  }))
  const valid = pts.filter(p => p.y !== null)
  if (valid.length < 2) return null

  // Build smooth polyline using cardinal spline approximation
  const pathD = valid.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`
    const prev = valid[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`
  }, '')

  const areaD = `${pathD} L ${valid[valid.length-1].x},${height} L ${valid[0].x},${height} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y-axis guides */}
      {[1,2,3,4,5].map(v => {
        const y = height - ((v-1)/4)*(height-12) - 6
        return <line key={v} x1="0" y1={y} x2={width} y2={y} stroke="var(--color-border)" strokeWidth="0.7" strokeDasharray="3,4" />
      })}
      {/* Area fill */}
      <path d={areaD} fill="url(#moodGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="var(--color-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {valid.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill="white" stroke="var(--color-purple)" strokeWidth="2" />
      ))}
    </svg>
  )
}

export default function MoodTracker({ moods, logMood }) {
  const today = todayISO()
  const todayMood = moods.find(m => m.date === today)
  const [selected, setSelected] = useState(todayMood?.mood || null)
  const [note, setNote] = useState(todayMood?.note || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleLog = async () => {
    if (!selected) return
    setSaving(true)
    await logMood(selected, note)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 14-day data for chart
  const chartData = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    const iso = d.toISOString().slice(0, 10)
    return { iso, mood: moods.find(m => m.date === iso)?.mood || null }
  }), [moods])

  // 7-day emoji row
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    const m = moods.find(x => x.date === iso)
    const obj = MOODS.find(x => x.value === m?.mood)
    return { iso, obj, dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,2) }
  }), [moods])

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 className="section-title">Mood</h2>
        <p className="section-subtitle">How are you feeling today?</p>
      </div>

      <div className="card" style={{ padding: '18px' }}>
        {/* Mood buttons */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
          {MOODS.map(m => (
            <motion.button key={m.value} whileTap={{ scale: 0.9 }} className={`mood-btn ${selected === m.value ? 'selected' : ''}`} onClick={() => setSelected(m.value)} style={{ flex: 1 }}>
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{m.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Note + save */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
          <input className="input-field" type="text" placeholder="Add a note (optional)…" value={note} onChange={e => setNote(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleLog()} />
          <button className="btn-primary" onClick={handleLog} disabled={!selected || saving} style={{ flexShrink: 0, opacity: !selected ? 0.5 : 1 }}>
            {saved ? '✓' : saving ? <span className="spinner" style={{ width: 13, height: 13 }} /> : 'Log'}
          </button>
        </div>

        {/* 7-day emoji timeline */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>This week</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {last7.map(({ iso, obj, dayLabel }) => {
              const isToday = iso === today
              return (
                <div key={iso} style={{ flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: 8, background: isToday ? 'var(--color-lavender)' : 'transparent', border: isToday ? '1px solid var(--color-lavender-mid)' : '1px solid transparent' }}>
                  <div style={{ fontSize: obj ? 20 : 14, opacity: obj ? 1 : 0.2, marginBottom: 3 }}>{obj?.emoji || '·'}</div>
                  <div style={{ fontSize: 9, color: isToday ? 'var(--color-purple)' : 'var(--color-text-muted)', fontWeight: isToday ? 600 : 400 }}>{dayLabel}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Area chart */}
        {chartData.some(d => d.mood) && (
          <>
            <hr className="divider" style={{ margin: '14px 0' }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>14-day trend</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{v:5,e:'🌟'},{v:3,e:'😌'},{v:1,e:'😞'}].map(({v,e}) => (
                    <span key={v} style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{e}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                <MoodAreaChart data={chartData} />
              </div>
            </div>
          </>
        )}

        {/* Recent notes */}
        {moods.filter(m => m.note).slice(0,3).length > 0 && (
          <>
            <hr className="divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {moods.filter(m => m.note).slice(0,3).map(m => {
                const obj = MOODS.find(x => x.value === m.mood)
                return (
                  <div key={m.date} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px', background: 'var(--color-lavender)', borderRadius: 9 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{obj?.emoji}</span>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>{formatDate(m.date)}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{m.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
