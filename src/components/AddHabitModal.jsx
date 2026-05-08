import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const COLORS = [
  '#8B5CF6', '#7DD3FC', '#84A98C', '#F59E0B',
  '#F472B6', '#34D399', '#FB923C', '#60A5FA',
]

const EMOJIS = ['✨', '🏃', '💧', '📓', '🧘', '🎯', '📚', '🍎', '💪', '🌱', '🎨', '🎵', '☀️', '🌙', '❤️', '🔥']

const CATEGORIES = ['Mind', 'Body', 'Soul', 'Work', 'Social', 'Health', 'Creative', 'General']

export default function AddHabitModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [color, setColor] = useState('#8B5CF6')
  const [category, setCategory] = useState('General')
  const [visibility, setVisibility] = useState('private')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onAdd({ name: name.trim(), emoji, color, category, visibility })
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="font-display" style={{ fontSize: 20 }}>New habit</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Habit name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Habit name
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: color + '20',
                  border: `2px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {emoji}
                </div>
                <input
                  className="input-field"
                  type="text"
                  placeholder="e.g. Morning meditation"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Emoji picker */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Choose an icon
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    style={{
                      width: 36, height: 36,
                      borderRadius: 8,
                      border: emoji === e ? '2px solid var(--color-purple)' : '2px solid var(--color-border)',
                      background: emoji === e ? 'var(--color-lavender)' : 'white',
                      fontSize: 18, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="color-swatch"
                    style={{ background: c, borderColor: color === c ? 'var(--color-text-primary)' : 'transparent' }}
                  />
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Category
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: category === cat ? '1.5px solid var(--color-purple)' : '1.5px solid var(--color-border)',
                      background: category === cat ? 'var(--color-lavender)' : 'white',
                      color: category === cat ? 'var(--color-purple)' : 'var(--color-text-secondary)',
                      fontSize: 12, fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Visibility
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'private', label: 'Private (Only you)' },
                  { id: 'friends', label: 'Circle (Trusted friends)' },
                  { id: 'public', label: 'Public (Profile)' }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVisibility(v.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: visibility === v.id ? '1.5px solid var(--color-purple)' : '1.5px solid var(--color-border)',
                      background: visibility === v.id ? 'var(--color-lavender)' : 'white',
                      color: visibility === v.id ? 'var(--color-purple)' : 'var(--color-text-secondary)',
                      fontSize: 12, fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !name.trim()}
                style={{ flex: 2, justifyContent: 'center', opacity: !name.trim() ? 0.6 : 1 }}
              >
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '＋'}
                Add habit
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
