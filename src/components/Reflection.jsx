import { useState } from 'react'
import { motion } from 'framer-motion'
import { todayISO, formatDate } from '../hooks/useStore'

export default function Reflection({ reflections, saveReflection }) {
  const today = todayISO()
  const [text, setText] = useState(reflections[today] || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await saveReflection(text.trim())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Recent reflections (last 5 days excluding today)
  const recentDates = Object.keys(reflections)
    .filter(d => d !== today && reflections[d])
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 4)

  const prompts = [
    'What small win happened today?',
    'What am I grateful for right now?',
    'One thing I want to remember from today…',
    'What felt good this week?',
    'What is one step I took toward my goals?',
  ]

  const dailyPrompt = prompts[new Date().getDay() % prompts.length]

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 className="section-title">Daily Reflection</h2>
        <p className="section-subtitle">A moment to pause and notice</p>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        {/* Prompt */}
        <p style={{
          fontSize: 13, color: 'var(--color-text-secondary)',
          fontStyle: 'italic', marginBottom: 12,
          padding: '10px 14px',
          background: 'var(--color-lavender)',
          borderRadius: 10,
          borderLeft: '3px solid var(--color-purple-light)',
        }}>
          ✍️ {dailyPrompt}
        </p>

        {/* Textarea */}
        <textarea
          className="input-field"
          placeholder="Write anything… this is your space."
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ minHeight: 90, marginBottom: 10 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {text !== (reflections[today] || '') && (
            <button
              onClick={() => setText(reflections[today] || '')}
              className="btn-ghost"
              style={{ fontSize: 12 }}
            >
              Discard
            </button>
          )}
          <motion.button
            className="btn-primary"
            onClick={handleSave}
            disabled={!text.trim() || saving}
            whileTap={{ scale: 0.95 }}
            style={{ opacity: !text.trim() ? 0.5 : 1 }}
          >
            {saved ? '✓ Saved' : saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save note'}
          </motion.button>
        </div>

        {/* Previous entries */}
        {recentDates.length > 0 && (
          <>
            <hr className="divider" style={{ margin: '16px 0' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Previous notes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentDates.map(date => (
                <div key={date} style={{
                  padding: '10px 14px',
                  background: 'var(--color-warm-white)',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>{formatDate(date)}</p>
                  <p style={{
                    fontSize: 13, color: 'var(--color-text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {reflections[date]}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
