import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Lock, Shield } from 'lucide-react'

export default function SettingsModal({ onClose, profile, updateProfile }) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    private_growth_mode: profile?.private_growth_mode || false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <motion.div 
        className="modal-content"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        style={{ maxWidth: 400, background: 'white', borderRadius: 16, maxHeight: '85vh', overflowY: 'auto' }}
        className="modal-content p-5 md:p-6"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Profile Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--color-lavender-mid)', padding: '12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Kaizen ID</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--color-purple)' }}>{profile?.kaizen_id || 'Generating...'}</div>
            </div>
            <Shield size={18} color="var(--color-purple)" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Display Name</label>
            <input 
              className="input-field" 
              value={form.display_name}
              onChange={e => setForm({...form, display_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Username</label>
            <input 
              className="input-field" 
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              required
              pattern="^[a-zA-Z0-9_]+$"
              title="Letters, numbers, and underscores only"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
            <div style={{ paddingRight: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                <Lock size={14} /> Private Growth Mode
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                When enabled, you are completely hidden from all social features, challenges, and search.
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
              <input 
                type="checkbox" 
                checked={form.private_growth_mode}
                onChange={e => setForm({...form, private_growth_mode: e.target.checked})}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: form.private_growth_mode ? 'var(--color-purple)' : '#cbd5e1',
                transition: '.4s', borderRadius: 24
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3,
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: form.private_growth_mode ? 'translateX(20px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
