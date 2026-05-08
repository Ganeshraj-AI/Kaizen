import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'
import { exportJSON, exportMarkdown, exportPrintHTML } from '../hooks/useStore'

const FORMATS = [
  { id: 'daily', type: 'pdf', label: 'Daily Reflection', icon: '✨', desc: 'A calm snapshot of a single day.' },
  { id: 'weekly', type: 'pdf', label: 'Weekly Rhythm', icon: '🌊', desc: 'A cinematic summary of your week.' },
  { id: 'monthly', type: 'pdf', label: 'Monthly Chapter', icon: '📖', desc: 'A deep reflection chapter of your life.' },
  { id: 'json', type: 'data', label: 'Data Backup', icon: '{ }', desc: 'Raw JSON data export' },
]

export default function ExportModal({ onClose, buildExportData, buildMarkdownExport, buildPrintHTML }) {
  const [format, setFormat] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    const dateStr = new Date().toISOString().slice(0, 10)
    try {
      const selectedFormat = FORMATS.find(f => f.id === format)
      if (selectedFormat.type === 'data') {
        exportJSON(buildExportData(), `kaizen-export-${dateStr}.json`)
      } else if (selectedFormat.type === 'pdf') {
        exportPrintHTML(buildPrintHTML(format))
      }
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 className="font-display" style={{ fontSize: 20 }}>Export your journey</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Your data belongs to you.</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
              <X size={17} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  border: `1.5px solid ${format === f.id ? 'var(--color-purple)' : 'var(--color-border)'}`,
                  borderRadius: 10, cursor: 'pointer', background: format === f.id ? 'var(--color-lavender)' : 'white',
                  textAlign: 'left', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease',
                }}>
                <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{f.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {FORMATS.find(f => f.id === format)?.type === 'pdf' && (
            <div style={{ padding: '10px 14px', background: 'var(--color-lavender)', border: '1px solid var(--color-lavender-mid)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--color-purple-dark)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <p style={{ margin: 0, lineHeight: 1.5 }}>A print dialog will open. Choose <strong>"Save as PDF"</strong> in your browser. Ensure "Background graphics" is enabled for the best cinematic experience.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={handleExport} className="btn-primary" disabled={loading || done} style={{ flex: 2, justifyContent: 'center' }}>
              {done ? '✓ Exported!' : loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Download size={13} /> Export {FORMATS.find(f => f.id === format)?.label}</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
