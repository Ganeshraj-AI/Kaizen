import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { todayISO } from '../hooks/useStore'

// Compassionate rate label — no shame in the language
function getRhythmLabel(pct) {
  if (pct === 0) return { label: 'Begin again', color: 'var(--color-text-muted)' }
  if (pct < 30) return { label: 'Slowly', color: 'var(--color-text-muted)' }
  if (pct < 60) return { label: 'Building', color: '#7C5CBF' }
  if (pct < 85) return { label: 'Consistent', color: '#6B9B73' }
  return { label: 'In flow', color: '#6B9B73' }
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getDays(year, month) {
  const total = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: total }, (_, i) => {
    const day = i + 1
    const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const dow = new Date(iso + 'T00:00:00').getDay()
    return { day, iso, dow, isWeekEnd: dow === 6 }
  })
}

export default function HabitGrid({ habits, completions, toggleCompletion, getStreakForHabit, onAddHabit, onDeleteHabit }) {
  const today = todayISO()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [confirmDelete, setConfirmDelete] = useState(null)

  const days = useMemo(() => getDays(year, month), [year, month])

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  const nextMonth = () => {
    if (isCurrentMonth) return
    if (month === 11) { setYear(y => y+1); setMonth(0) } else setMonth(m => m+1)
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 className="section-title">Your Rituals</h2>
          <p className="section-subtitle">Touch a day to mark it — every return counts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'white', border: '1px solid var(--color-border)', borderRadius: 9, padding: '2px 3px' }}>
            <button onClick={prevMonth} style={{ padding: '3px 7px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 6, display: 'flex' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', minWidth: 106, textAlign: 'center' }}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth} style={{ padding: '3px 7px', background: 'none', border: 'none', cursor: isCurrentMonth ? 'default' : 'pointer', color: isCurrentMonth ? 'var(--color-border)' : 'var(--color-text-muted)', borderRadius: 6, display: 'flex' }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <button className="btn-primary" onClick={onAddHabit} style={{ padding: '7px 12px', fontSize: 12 }}>
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {habits.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '48px 24px', borderRadius: 18, border: '1.5px dashed rgba(196,181,253,0.4)', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 18, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: 8 }}>Begin with one small ritual.</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>A habit doesn't have to be ambitious. It just has to be yours.</p>
          <button className="btn-primary" onClick={onAddHabit} style={{ margin: '0 auto' }}><Plus size={13} /> Add your first ritual</button>
        </motion.div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="tracker-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ background: 'var(--color-lavender)' }}>
                  <th style={{ padding: '8px 14px 8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', minWidth: 170, position: 'sticky', left: 0, zIndex: 2, background: 'var(--color-lavender)' }}>
                    Habit
                  </th>
                  {days.map(({ day, iso, isWeekEnd }) => {
                    const isToday = iso === today
                    return (
                      <th key={iso} style={{
                        padding: '7px 1px', fontSize: 9, fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'var(--color-purple)' : 'var(--color-text-muted)',
                        textAlign: 'center', background: 'var(--color-lavender)',
                        borderBottom: '1px solid var(--color-border)', minWidth: 28,
                        borderRight: isWeekEnd ? '1px solid var(--color-border)' : 'none',
                        position: 'relative',
                      }}>
                        {isToday && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--color-purple)' }} />}
                        {day}
                      </th>
                    )
                  })}
                  <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', minWidth: 80, textAlign: 'center', background: 'var(--color-lavender)' }}>
                    Rhythm
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {habits.map((habit, rowIdx) => {
                    const done = days.filter(({ iso }) => completions[`${habit.id}_${iso}`]).length
                    const possible = days.filter(({ iso }) => iso <= today).length
                    const pct = possible > 0 ? Math.round((done / possible) * 100) : 0
                    const { current: streak } = getStreakForHabit(habit.id)

                    return (
                      <motion.tr key={habit.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        transition={{ delay: rowIdx * 0.03 }}
                        style={{ borderBottom: '1px solid var(--color-border-soft)' }}
                        className="habit-row"
                      >
                        {/* Label */}
                        <td style={{ padding: '6px 10px 6px 14px', background: 'white', position: 'sticky', left: 0, zIndex: 1, borderRight: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 7, background: habit.color + '18', border: `1.5px solid ${habit.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                              {habit.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit.name}</div>
                              {streak > 0 && (
                                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1 }}>
                                  {streak >= 7 ? 'in your rhythm' : streak >= 3 ? `${streak} days in a row` : 'returning'}
                                </div>
                              )}
                            </div>
                            <button className="del-btn" onClick={() => setConfirmDelete(habit.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'transparent', padding: 2, borderRadius: 4, display: 'flex', transition: 'color 0.15s ease' }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>

                        {/* Cells */}
                        {days.map(({ iso, isWeekEnd }) => {
                          const isCompleted = Boolean(completions[`${habit.id}_${iso}`])
                          const isFuture = iso > today
                          const isToday = iso === today

                          return (
                            <td key={iso} style={{ padding: '4px 1px', textAlign: 'center', borderRight: isWeekEnd ? '1px solid var(--color-border)' : 'none' }}>
                              <motion.button
                                whileTap={!isFuture ? { scale: 0.78 } : {}}
                                onClick={() => !isFuture && toggleCompletion(habit.id, iso)}
                                className={`habit-cell ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
                                style={{
                                  margin: '0 auto',
                                  background: isCompleted ? habit.color : undefined,
                                  borderColor: isCompleted ? 'transparent' : isToday ? habit.color + '50' : undefined,
                                }}
                                aria-label={`${habit.name} ${iso} ${isCompleted ? 'done' : 'not done'}`}
                              >
                                <AnimatePresence>
                                  {isCompleted && (
                                    <motion.span key="check" initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                      style={{ fontSize: 11, color: 'white', display: 'block', lineHeight: 1 }}>✓</motion.span>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            </td>
                          )
                        })}

                        {/* Rhythm — compassionate label, no shame */}
                        <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                          {(() => {
                            const { label, color } = getRhythmLabel(pct)
                            return (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 4 }}>{label}</div>
                                <div className="progress-bar" style={{ width: 44, margin: '0 auto' }}>
                                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
            <motion.div className="modal-content" style={{ maxWidth: 300 }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
              <h3 className="font-display" style={{ fontSize: 17, marginBottom: 6 }}>Let go of this habit?</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 18 }}>Sometimes a ritual no longer serves us. All its data will be removed.</p>
              <div style={{ display: 'flex', gap: 7 }}>
                <button className="btn-ghost" onClick={() => setConfirmDelete(null)} style={{ flex: 1, justifyContent: 'center' }}>Keep it</button>
                <button onClick={() => { onDeleteHabit(confirmDelete); setConfirmDelete(null) }}
                  style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Let go
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .habit-row:hover .del-btn { color: var(--color-text-muted) !important; }
        .del-btn:hover { color: #DC2626 !important; }
      `}</style>
    </section>
  )
}
