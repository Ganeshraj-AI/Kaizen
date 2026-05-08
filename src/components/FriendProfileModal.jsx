import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Quote, Calendar, Activity, AlertCircle } from 'lucide-react'
import { getActivityMessage } from '../utils/language'

class ProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Profile rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#EF4444', background: '#FEF2F2', borderRadius: 16 }}>
          <AlertCircle size={24} style={{ marginBottom: 12, opacity: 0.8 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Something went wrong</p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>We encountered an error rendering this profile.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const calculateRhythm = (habitId, completions) => {
  if (!completions) return 0
  let count = 0
  let today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (completions[`${habitId}_${dateStr}`]) count++
  }
  return count
}

export default function FriendProfileModal({ friend, onClose, getFriendActivity }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ habits: [], completions: {}, sharedReflections: [] })
  
  const getFriendActivityRef = React.useRef(getFriendActivity)
  const fetchInProgress = React.useRef(false)
  const lastFetchedId = React.useRef(null)

  useEffect(() => {
    getFriendActivityRef.current = getFriendActivity
  }, [getFriendActivity])

  useEffect(() => {
    let mounted = true
    let isCancelled = false

    async function load() {
      const currentId = friend?.id
      const fetchFn = getFriendActivityRef.current

      if (!fetchFn || !currentId) {
        if (mounted) setLoading(false)
        return
      }

      // Prevent duplicate inflight requests or redundant fetches for the same friend
      if (fetchInProgress.current && lastFetchedId.current === currentId) {
        return
      }

      fetchInProgress.current = true
      lastFetchedId.current = currentId
      
      if (mounted && !loading) setLoading(true)
      if (mounted && error) setError(null)

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Unable to load shared journey right now.')), 5000)
        )
        const activity = await Promise.race([
          fetchFn(currentId),
          timeoutPromise
        ])
        
        if (mounted && !isCancelled && activity) {
          setData({
            habits: Array.isArray(activity.habits) ? activity.habits : [],
            completions: activity.completions || {},
            sharedReflections: Array.isArray(activity.sharedReflections) ? activity.sharedReflections : []
          })
        }
      } catch (err) {
        // Only log once, not on every render
        if (!isCancelled) {
          console.error('[FriendProfileModal] Failed to load friend activity:', err)
          if (mounted) setError(err.message || 'Unable to load shared journey right now.')
        }
      } finally {
        if (!isCancelled) {
          fetchInProgress.current = false
          if (mounted) setLoading(false)
        }
      }
    }
    
    load()
    
    return () => { 
      mounted = false 
      isCancelled = true
      fetchInProgress.current = false
    }
  }, [friend?.id]) // Intentionally excluded getFriendActivity to prevent loops

  return (
    <div className="modal-overlay">
      <motion.div 
        className="modal-content"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        style={{ width: '100%', maxWidth: 500, background: 'var(--color-warm-white)', padding: 0, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="p-5 md:p-8 bg-white border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 md:gap-4 items-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--color-lavender-mid)] flex items-center justify-center text-[var(--color-purple-dark)] text-xl md:text-2xl font-semibold flex-shrink-0">
                {friend?.display_name ? friend.display_name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-lg md:text-[22px] font-display text-[var(--color-text-primary)] leading-tight">{friend?.display_name || 'Friend'}</h2>
                <div className="text-[11px] md:text-[13px] text-[var(--color-text-muted)] flex gap-2 items-center mt-1">
                  <span className="truncate max-w-[100px] md:max-w-none">@{friend?.username || 'unknown'}</span>
                  <span className="px-2 py-0.5 bg-[var(--color-lavender)] rounded-full text-[var(--color-purple)] text-[10px] md:text-[11px] font-medium flex-shrink-0">
                    {friend?.kaizen_id || 'ID'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] p-1 ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-8 overflow-y-auto relative flex-1">
          <ProfileErrorBoundary>
            {error ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 32, textAlign: 'center', color: '#EF4444', background: '#FEF2F2', borderRadius: 16 }}>
                <AlertCircle size={24} style={{ marginBottom: 12, opacity: 0.8 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>{error}</p>
                <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>The connection dropped or this profile is unavailable.</p>
              </motion.div>
            ) : loading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div>
                  <div style={{ width: 120, height: 16, background: 'var(--color-border)', borderRadius: 8, marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 76, background: 'var(--color-border)', borderRadius: 16, animation: 'pulse 1.5s infinite', opacity: 0.6 }} />
                  <div style={{ height: 76, background: 'var(--color-border)', borderRadius: 16, animation: 'pulse 1.5s infinite', opacity: 0.6, marginTop: 12 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {/* Habits */}
                <div>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={14} /> Shared Journey
                  </h3>
                  {(!data.habits || data.habits.length === 0) ? (
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No habits shared with the circle yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {data.habits.map((h, idx) => {
                        if (!h) return null
                        const rhythm = calculateRhythm(h.id, data.completions)
                        const message = typeof getActivityMessage === 'function' ? getActivityMessage('habit_rhythm', { rhythm }) : 'Growing quietly.'
                        const safeColor = (typeof h.color === 'string' && h.color.startsWith('#')) ? h.color : '#8B5CF6'
                        
                        return (
                          <div key={h.id || `h-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'white', padding: 16, borderRadius: 16, border: '1px solid var(--color-border)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: safeColor + '20', border: `2px solid ${safeColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                              {h.emoji || '✨'}
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{h.name || 'Unnamed habit'}</div>
                              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{message}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Shared Reflections */}
                <div>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Quote size={14} /> Thoughts & Reflections
                  </h3>
                  {(!data.sharedReflections || data.sharedReflections.length === 0) ? (
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No reflections shared recently.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {data.sharedReflections.map((ref, idx) => {
                        if (!ref) return null
                        let dateStr = 'Recently'
                        try {
                          if (ref.created_at) dateStr = new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        } catch(e) {}
                        return (
                          <div key={ref.id || `ref-${idx}`} style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid var(--color-border)', position: 'relative' }}>
                            <Quote size={24} color="var(--color-lavender)" style={{ position: 'absolute', top: 16, left: 16, opacity: 0.5 }} />
                            <p style={{ fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.6, paddingLeft: 32, fontStyle: 'italic' }}>
                              "{ref.content || ''}"
                            </p>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12, paddingLeft: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Calendar size={12} />
                              {dateStr}
                              <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-border)' }} />
                              <span style={{ textTransform: 'capitalize' }}>{ref.snippet_type || 'thought'}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </ProfileErrorBoundary>
        </div>
      </motion.div>
    </div>
  )
}
