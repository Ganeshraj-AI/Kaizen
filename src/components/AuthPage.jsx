import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthPage({ onSignIn, onSignUp, authMode, setAuthMode, isDemo, enterDemoMode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isLogin = authMode === 'login'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await onSignIn(email, password)
      } else {
        result = await onSignUp(email, password, name)
      }

      if (result?.error) {
        setError(result.error.message || 'Something went wrong.')
      } else if (!isLogin && !isDemo) {
        setSuccess('Check your email for a confirmation link ✨')
      }
    } finally {
      setLoading(false)
    }
  }

  const enterDemo = () => {
    enterDemoMode()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FAF9F6 0%, #F5F3FF 50%, #FAF9F6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        {[
          { w: 400, h: 400, t: '-100px', l: '-100px', c: 'rgba(139,92,246,0.06)' },
          { w: 300, h: 300, b: '50px', r: '50px', c: 'rgba(125,211,252,0.08)' },
          { w: 200, h: 200, t: '40%', l: '60%', c: 'rgba(132,169,140,0.07)' },
        ].map((blob, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: blob.w, height: blob.h,
            top: blob.t, left: blob.l, bottom: blob.b, right: blob.r,
            borderRadius: '50%',
            background: blob.c,
            filter: 'blur(60px)',
          }} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="auth-card"
        style={{ position: 'relative' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #8B5CF6, #7DD3FC)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 22,
          }}>🌱</div>
          <h1 className="font-display" style={{ fontSize: 28, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
            Kaizen
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Small steps. Every day.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--color-lavender)',
          borderRadius: 10,
          padding: 3,
          marginBottom: 24,
          gap: 2,
        }}>
          {['login', 'signup'].map(mode => (
            <button
              key={mode}
              onClick={() => { setAuthMode(mode); setError(''); setSuccess('') }}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s ease',
                background: authMode === mode ? 'white' : 'transparent',
                color: authMode === mode ? 'var(--color-purple)' : 'var(--color-text-muted)',
                boxShadow: authMode === mode ? 'var(--shadow-card)' : 'none',
              }}
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Your name
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="How shall we call you?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                fontSize: 13,
                color: '#DC2626',
              }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                fontSize: 13,
                color: '#15803D',
              }}
            >
              {success}
            </motion.div>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            {isLogin ? 'Sign in' : 'Start your journey'}
          </button>
        </form>

        {/* Demo mode */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <hr className="divider" style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>or</span>
            <hr className="divider" style={{ flex: 1 }} />
          </div>
          <button
            onClick={enterDemo}
            style={{
              width: '100%',
              padding: '10px',
              border: '1.5px dashed var(--color-purple-light)',
              borderRadius: 10,
              background: 'var(--color-lavender)',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s ease',
            }}
          >
            ✨ Try demo — no account needed
          </button>
        </div>

        {isDemo && (
          <p style={{
            marginTop: 14,
            fontSize: 11,
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Running in local demo mode. Data saves to your browser.
            <br />Connect Supabase to enable sync across devices.
          </p>
        )}
      </motion.div>
    </div>
  )
}
