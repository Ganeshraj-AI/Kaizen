import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const INTENSITY_COLORS = [
  '#F0EDF8',  // 0 – empty
  '#DDD6FE',  // 1 – faint
  '#C4B5FD',  // 2 – light
  '#A78BFA',  // 3 – medium
  '#7C3AED',  // 4 – strong
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ConsistencyMap({ getHeatmapData, habits }) {
  const heatmapData = getHeatmapData()
  const maxCount = Math.max(habits.length, 1)
  const [tooltip, setTooltip] = useState(null)

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    const weeks = []
    const monthLabels = []

    // Start from 52 weeks ago (Sunday)
    const start = new Date(today)
    start.setDate(start.getDate() - today.getDay() - 52 * 7 + 1)

    let cur = new Date(start)
    let lastMonth = -1

    for (let w = 0; w < 53; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const iso = cur.toISOString().slice(0, 10)
        const mon = cur.getMonth()
        if (d === 0 && mon !== lastMonth) {
          monthLabels.push({ col: w, month: mon })
          lastMonth = mon
        }
        week.push({ iso, count: heatmapData[iso] || 0, future: cur > today })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push(week)
    }
    return { weeks, monthLabels }
  }, [heatmapData])

  const totalActive = Object.values(heatmapData).filter(v => v > 0).length
  const totalChecks = Object.values(heatmapData).reduce((s, v) => s + v, 0)

  function getColor(count, isFuture) {
    if (isFuture || count === 0) return INTENSITY_COLORS[0]
    const intensity = Math.ceil((count / maxCount) * 4)
    return INTENSITY_COLORS[Math.min(intensity, 4)]
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 className="section-title">Consistency Map</h2>
          <p className="section-subtitle">Your year in habits</p>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 19, color: 'var(--color-purple)' }}>{totalActive}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>active days</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 19, color: 'var(--color-purple)' }}>{totalChecks}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>total checks</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ overflowX: 'auto' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginBottom: 4, marginLeft: 18, position: 'relative', minWidth: weeks.length * 13 }}>
            {monthLabels.map(({ col, month }, i) => (
              <div key={i} style={{ position: 'absolute', left: col * 13, fontSize: 9, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {MONTHS[month]}
              </div>
            ))}
            <div style={{ height: 12 }} />
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: 1.5 }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5, marginRight: 3 }}>
              {['','M','','W','','F',''].map((d, i) => (
                <div key={i} style={{ width: 10, height: 11, fontSize: 8, color: 'var(--color-text-muted)', lineHeight: '11px', textAlign: 'right' }}>{d}</div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {week.map(({ iso, count, future }) => {
                  const color = getColor(count, future)
                  return (
                    <motion.div
                      key={iso}
                      className="heat-cell"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: future ? 0.3 : 1, scale: 1 }}
                      transition={{ delay: wi * 0.004, duration: 0.2 }}
                      onMouseEnter={e => setTooltip({ iso, count, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        background: color,
                        width: 11, height: 11,
                        borderRadius: 3,
                        boxShadow: count > 0 && !future ? `0 0 0 1px ${color}` : 'none',
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>Less</span>
          {INTENSITY_COLORS.map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
          ))}
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', top: tooltip.y - 36, left: tooltip.x - 60,
          background: 'var(--color-text-primary)', color: 'white',
          padding: '4px 9px', borderRadius: 7, fontSize: 11,
          pointerEvents: 'none', zIndex: 200, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {tooltip.iso} · {tooltip.count} habit{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}
    </section>
  )
}
