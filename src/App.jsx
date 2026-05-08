import { useStore } from './hooks/useStore'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'

export default function App() {
  const store = useStore()
  const { user, loading, signIn, signUp, authMode, setAuthMode, isDemo } = store

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-warm-white)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #8B5CF6, #7DD3FC)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>🌱</div>
        <div className="spinner" style={{ width: 24, height: 24 }} />
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading your journey…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthPage
        onSignIn={signIn}
        onSignUp={signUp}
        authMode={authMode}
        setAuthMode={setAuthMode}
        isDemo={isDemo}
      />
    )
  }

  return <Dashboard store={store} />
}
