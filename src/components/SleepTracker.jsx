import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { todayISO } from '../hooks/useStore'

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function getSleepColor(h) {
  if (h >= 7.5) return { bar: '#6EE7B7', text: '#059669' }
  if (h >= 6) return { bar: '#7DD3FC', text: '#0284C7' }
  if (h > 0) return { bar: '#FCD34D', text: '#B45309' }
  return { bar: 'var(--color-border)', text: 'var(--color-text-muted)' }
}

export default function SleepTracker({ sleepLogs, logSleep }) {
  const today = todayISO()
  const todayEntry = sleepLogs.find(s => s.date === today)
  const [hours, setHours] = useState(todayEntry?.hours || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleLog = async () => {
    const h = parseFloat(hours)
    if (isNaN(h) || h < 0 || h > 24) return
    setSaving(true)
    await logSleep(h)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    const entry = sleepLogs.find(s => s.date === iso)
    return { iso, hours: entry?.hours || 0, dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,3), isToday: iso === today }
  }), [sleepLogs])

  const maxH = 10
  const barMaxPx = 88
  const avgSleep = (() => {
    const valid = last7.filter(d => d.hours > 0)
    return valid.length ? (valid.reduce((s, d) => s + d.hours, 0) / valid.length).toFixed(1) : null
  })()

  // Ideal line Y position
  const idealY = barMaxPx - (8 / maxH) * barMaxPx

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 className="section-title">Sleep</h2>
        <p className="section-subtitle">Rest is part of the journey</p>
      </div>

      <div className="card" style={{ padding: '18px' }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: 'var(--color-lavender)', borderRadius: 11 }}>
          <span style={{ fontSize: 18 }}>🌙</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flex: 1 }}>Last night I slept</span>
          <input type="number" min="0" max="24" step="0.5" placeholder="7.5" value={hours} onChange={e => setHours(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLog()}
            style={{ width: 56, border: 'none', background: 'transparent', fontSize: 20, fontWeight: 700, color: 'var(--color-purple)', fontFamily: 'var(--font-body)', outline: 'none', textAlign: 'center' }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>h</span>
          <button className="btn-primary" onClick={handleLog} disabled={!hours || saving} style={{ padding: '7px 14px', opacity: !hours ? 0.5 : 1 }}>
            {saved ? '✓' : saving ? <span className="spinner" style={{ width: 13, height: 13 }} /> : 'Save'}
          </button>
        </div>

        {/* Bar chart */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>7-night view</p>
            {avgSleep && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>avg <strong style={{ color: 'var(--color-text-primary)' }}>{avgSleep}h</strong></span>}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', position: 'relative', paddingLeft: 28 }}>
            {/* Y labels */}
            <div style={{ position: 'absolute', left: 0, bottom: 0, height: barMaxPx, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 2 }}>
              {[9, 7, 5].map(l => (
                <span key={l} style={{ fontSize: 8, color: 'var(--color-text-muted)', lineHeight: '10px' }}>{l}h</span>
              ))}
            </div>

            {/* Ideal 8h line */}
            <div style={{ position: 'absolute', left: 28, right: 0, bottom: (8/maxH)*barMaxPx, height: 1.5, background: 'var(--color-purple)', opacity: 0.25, borderRadius: 99 }} />

            {last7.map(({ iso, hours: h, dayLabel, isToday }) => {
              const barH = h > 0 ? clamp((h / maxH) * barMaxPx, 4, barMaxPx) : 3
              const { bar: barColor, text: textColor } = getSleepColor(h)

              return (
                <div key={iso} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ height: barMaxPx, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barH }}
                      transition={{ duration: 0.55, delay: 0.05, ease: [0.34,1.56,0.64,1] }}
                      title={h > 0 ? `${h}h` : 'No data'}
                      style={{
                        width: '100%', borderRadius: '5px 5px 0 0',
                        background: h > 0 ? `linear-gradient(to top, ${barColor}, ${barColor}90)` : 'var(--color-border)',
                        opacity: h > 0 ? 1 : 0.35,
                        cursor: 'default',
                        boxShadow: h > 0 ? `0 2px 8px ${barColor}50` : 'none',
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: isToday ? 'var(--color-purple)' : 'var(--color-text-muted)', fontWeight: isToday ? 700 : 400 }}>{dayLabel}</div>
                    {h > 0 && <div style={{ fontSize: 9, color: textColor, fontWeight: 600 }}>{h}h</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 1.5, background: 'var(--color-purple)', opacity: 0.4 }} />
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>8h ideal</span>
            </div>
            {[{ color: '#6EE7B7', label: '7.5h+ great' }, { color: '#7DD3FC', label: '6–7.5h ok' }, { color: '#FCD34D', label: '<6h low' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
