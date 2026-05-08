import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { todayISO, formatDate, formatDateFull } from '../hooks/useStore'

const MOODS = [
  { value: 5, emoji: '🌟', label: 'Amazing' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 3, emoji: '😌', label: 'Okay' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 1, emoji: '😞', label: 'Hard' },
]

const ALL_TAGS = ['productive', 'calm', 'creative', 'social', 'tired', 'grateful', 'focused', 'growth', 'rest', 'challenge']

function emptyEntry(date) {
  return { date, title: '', mood: null, reflection: '', wins: [], struggles: [], notes: '', gratitude: [], tags: [] }
}

function ListInput({ label, items, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (!draft.trim()) return
    onChange([...items, draft.trim()])
    setDraft('')
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--color-lavender)', borderRadius: 8 }}>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{item}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, display: 'flex' }}>
              <X size={12} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input-field" style={{ flex: 1, padding: '7px 10px' }} placeholder={placeholder} value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
          <button onClick={add} className="btn-ghost" style={{ padding: '7px 12px', flexShrink: 0 }}>+ Add</button>
        </div>
      </div>
    </div>
  )
}

function EntryEditor({ entry, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(entry)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleTag = (t) => set('tags', form.tags?.includes(t) ? form.tags.filter(x => x !== t) : [...(form.tags || []), t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>{formatDateFull(form.date)}</p>
          <input
            className="input-field"
            style={{ padding: '6px 0', border: 'none', fontSize: 17, fontFamily: 'var(--font-display)', fontWeight: 400, background: 'transparent', boxShadow: 'none' }}
            placeholder="Give today a title…"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Mood */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>How did today feel?</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {MOODS.map(m => (
              <button key={m.value} className={`mood-btn ${form.mood === m.value ? 'selected' : ''}`} onClick={() => set('mood', form.mood === m.value ? null : m.value)} style={{ flex: 1, minWidth: 'auto', padding: '8px 4px', fontSize: 20 }}>
                {m.emoji}
                <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Reflection</label>
          <textarea className="input-field" placeholder="What's on your mind today? How did it go? What did you notice?…" value={form.reflection} onChange={e => set('reflection', e.target.value)} style={{ minHeight: 96 }} />
        </div>

        {/* Wins */}
        <ListInput label="✨ Wins" items={form.wins || []} onChange={v => set('wins', v)} placeholder="Something that went well…" />

        {/* Gratitude */}
        <ListInput label="🙏 Gratitude" items={form.gratitude || []} onChange={v => set('gratitude', v)} placeholder="I'm grateful for…" />

        {/* Struggles */}
        <ListInput label="💙 Struggles" items={form.struggles || []} onChange={v => set('struggles', v)} placeholder="Something that was hard…" />

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</label>
          <textarea className="input-field" placeholder="Random thoughts, ideas, reminders…" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: 64 }} />
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_TAGS.map(t => (
              <button key={t} className="tag-pill" onClick={() => toggleTag(t)}
                style={{ background: form.tags?.includes(t) ? 'var(--color-lavender-mid)' : undefined, fontWeight: form.tags?.includes(t) ? 600 : 400 }}>
                {form.tags?.includes(t) ? '✓ ' : ''}{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        {onDelete && (
          <button onClick={() => onDelete(form.date)} className="btn-ghost" style={{ padding: '8px 12px', color: '#DC2626', borderColor: '#FECACA' }}>
            <Trash2 size={13} />
          </button>
        )}
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
          {saved ? '✓ Saved' : saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save entry'}
        </button>
      </div>
    </div>
  )
}

export default function Journal({ journalEntries, getJournalEntry, saveJournalEntry, deleteJournalEntry, habits, completions, moods, sleepLogs }) {
  const today = todayISO()
  const [selectedDate, setSelectedDate] = useState(today)
  const [search, setSearch] = useState('')
  const [filterMood, setFilterMood] = useState(null)
  const [filterTag, setFilterTag] = useState(null)
  const [viewMode, setViewMode] = useState('timeline') // 'timeline' | 'calendar'

  const selectedEntry = getJournalEntry(selectedDate) || emptyEntry(selectedDate)

  const filtered = journalEntries.filter(e => {
    if (filterMood && e.mood !== filterMood) return false
    if (filterTag && !e.tags?.includes(filterTag)) return false
    if (search) {
      const q = search.toLowerCase()
      return [e.title, e.reflection, e.notes, ...(e.wins || []), ...(e.gratitude || []), ...(e.struggles || [])].some(t => t?.toLowerCase().includes(q))
    }
    return true
  })

  // Calendar view: current month
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDow = new Date(calYear, calMonth, 1).getDay()

  // Cross-data for selected date
  const dateHabitsDone = habits.filter(h => completions[`${h.id}_${selectedDate}`]).length
  const dateMood = moods.find(m => m.date === selectedDate)
  const dateSleep = sleepLogs.find(s => s.date === selectedDate)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input-field" placeholder="Search entries…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, padding: '8px 12px 8px 30px' }} />
        </div>
        {/* Mood filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {MOODS.map(m => (
            <button key={m.value} onClick={() => setFilterMood(filterMood === m.value ? null : m.value)}
              style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${filterMood === m.value ? 'var(--color-purple)' : 'var(--color-border)'}`, background: filterMood === m.value ? 'var(--color-lavender)' : 'white', cursor: 'pointer', fontSize: 14 }}>
              {m.emoji}
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--color-lavender)', borderRadius: 8, padding: 2 }}>
          {['timeline', 'calendar'].map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{ padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, background: viewMode === v ? 'white' : 'transparent', color: viewMode === v ? 'var(--color-purple)' : 'var(--color-text-muted)', transition: 'all 0.15s ease' }}>
              {v === 'timeline' ? '≡ Timeline' : '⊞ Calendar'}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ padding: '8px 14px' }} onClick={() => setSelectedDate(today)}>
          <Plus size={13} /> Today
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12, minHeight: 600, alignItems: 'start' }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {viewMode === 'calendar' ? (
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11) } else setCalMonth(m => m-1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                  <ChevronLeft size={15} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{MONTHS[calMonth]} {calYear}</span>
                <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0) } else setCalMonth(m => m+1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
                {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} style={{ fontSize: 9, color: 'var(--color-text-muted)', padding: '2px 0', fontWeight: 600 }}>{d}</div>)}
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const iso = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const hasEntry = journalEntries.some(e => e.date === iso)
                  const isToday = iso === today
                  const isSel = iso === selectedDate
                  return (
                    <button key={iso} onClick={() => setSelectedDate(iso)}
                      style={{ aspectRatio: '1', borderRadius: 6, border: `1.5px solid ${isSel ? 'var(--color-purple)' : isToday ? 'var(--color-purple-light)' : 'transparent'}`, background: isSel ? 'var(--color-lavender-mid)' : 'transparent', cursor: 'pointer', fontSize: 11, color: isToday ? 'var(--color-purple)' : 'var(--color-text-secondary)', fontWeight: isToday ? 700 : 400, position: 'relative', padding: '4px 2px' }}>
                      {day}
                      {hasEntry && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-purple)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 600, overflowY: 'auto' }}>
              {/* Today shortcut if no entry */}
              {!journalEntries.find(e => e.date === today) && (
                <button className="journal-card" onClick={() => setSelectedDate(today)} style={{ textAlign: 'left', width: '100%', fontFamily: 'var(--font-body)' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-purple)', fontWeight: 600, marginBottom: 3 }}>Today</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Start today's entry…</div>
                </button>
              )}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  {search || filterMood ? 'No entries match' : 'Your journal is empty'}
                </div>
              )}
              <AnimatePresence>
                {filtered.map(e => {
                  const moodObj = MOODS.find(m => m.value === e.mood)
                  const isSel = e.date === selectedDate
                  return (
                    <motion.button key={e.date} layout className={`journal-card ${isSel ? 'active' : ''}`} onClick={() => setSelectedDate(e.date)}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      style={{ textAlign: 'left', width: '100%', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(e.date)}{e.date === today ? ' · Today' : ''}</span>
                        {moodObj && <span style={{ fontSize: 14 }}>{moodObj.emoji}</span>}
                      </div>
                      {e.title && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{e.title}</div>}
                      {e.reflection && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.reflection}</p>}
                      {e.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                          {e.tags.slice(0,3).map(t => <span key={t} className="tag-pill" style={{ fontSize: 10 }}>{t}</span>)}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Entry editor */}
        <div className="card" style={{ padding: '18px 20px', minHeight: 540 }}>
          {/* Context bar from life data */}
          {(dateHabitsDone > 0 || dateMood || dateSleep) && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'var(--color-lavender)', borderRadius: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {dateHabitsDone > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>✅ {dateHabitsDone}/{habits.length} habits</span>}
              {dateMood && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{MOODS.find(m => m.value === dateMood.mood)?.emoji} {MOODS.find(m => m.value === dateMood.mood)?.label}</span>}
              {dateSleep && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>🌙 {dateSleep.hours}h sleep</span>}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={selectedDate} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
              <EntryEditor
                entry={selectedEntry}
                onSave={saveJournalEntry}
                onDelete={getJournalEntry(selectedDate) ? deleteJournalEntry : null}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
