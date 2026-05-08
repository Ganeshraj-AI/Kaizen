import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Home, Grid3X3, Smile, Moon, Map, BookOpen, Download, Menu, X, Settings, Users } from 'lucide-react'
import HabitGrid from './HabitGrid'
import AddHabitModal from './AddHabitModal'
import MoodTracker from './MoodTracker'
import SleepTracker from './SleepTracker'
import ConsistencyMap from './ConsistencyMap'
import HomePage from './HomePage'
import Journal from './Journal'
import StatsBar from './StatsBar'
import ExportModal from './ExportModal'
import SettingsModal from './SettingsModal'
import NetworkDashboard from './NetworkDashboard'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tracker', label: 'Tracker', icon: Grid3X3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'mood', label: 'Mood', icon: Smile },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'circle', label: 'Circle', icon: Users },
]

export default function Dashboard({ store }) {
  const [activeTab, setActiveTab] = useState('home')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const {
    user, profile, habits, completions, moods, sleepLogs, reflections, journalEntries,
    signOut, addHabit, deleteHabit, toggleCompletion, updateProfile,
    logMood, logSleep, saveReflection,
    saveJournalEntry, deleteJournalEntry, getJournalEntry, getInsights,
    getStreakForHabit, getOverallStreak, getWeeklyCompletionRate,
    getHeatmapData, getTodayRate, isDemo,
    buildExportData, buildMarkdownExport, buildPrintHTML,
  } = store

  const userName = profile?.display_name || user?.user_metadata?.name || user?.name || user?.email?.split('@')[0] || 'You'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-warm-white)' }}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(250,249,246,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(234,230,244,0.6)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          height: 56, gap: 0,
          padding: '0 32px',
        }}>
          {/* Wordmark — no icon, just the name */}
          <div style={{ flexShrink: 0, marginRight: 32 }}>
            <span
              className="font-display"
              style={{
                fontSize: 22,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.5px',
                lineHeight: 1,
              }}
            >
              Kaizen
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="desktop-only" style={{ display: 'flex', gap: 1, flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  <Icon size={13} />{item.label}
                </button>
              )
            })}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {isDemo && (
              <span style={{
                padding: '2px 8px', borderRadius: 99,
                background: 'rgba(255,221,210,0.6)', border: '1px solid #FECACA',
                fontSize: 10, color: '#92400E', fontWeight: 500,
              }}>
                Demo
              </span>
            )}

            {/* Export */}
            <button
              onClick={() => setShowExport(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: '6px 8px',
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                fontFamily: 'var(--font-body)', borderRadius: 7,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-purple)'; e.currentTarget.style.background = 'var(--color-lavender)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none' }}
              title="Export"
            >
              <Download size={13} />
              <span className="desktop-only">Export</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: '6px 8px',
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                fontFamily: 'var(--font-body)', borderRadius: 7, transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
              title="Settings"
            >
              <Settings size={13} />
            </button>

            {/* User avatar */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '4px 10px 4px 4px',
                borderRadius: 99, cursor: 'default',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-sky-mid))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--color-purple-dark)',
              }}>
                {initial}
              </div>
              <span className="desktop-only" style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {userName}
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={signOut}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: '6px 8px',
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                fontFamily: 'var(--font-body)', borderRadius: 7, transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              <LogOut size={13} />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'fixed', top: 56, left: 0, right: 0,
              background: 'rgba(250,249,246,0.97)', backdropFilter: 'blur(16px)',
              zIndex: 9, borderBottom: '1px solid var(--color-border)',
              padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 3,
            }}
          >
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                  className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Icon size={13} />{item.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 60px' }}>

        {/* Page title — subtle, not giant */}
        {activeTab !== 'home' && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-display" style={{ fontSize: 30, letterSpacing: '-0.5px', color: 'var(--color-text-primary)' }}>
              {{
                tracker: 'Tracker', journal: 'Journal',
                mood: 'Mood', sleep: 'Sleep', map: 'Consistency',
                circle: 'Growth Circle'
              }[activeTab]}
            </h1>
          </div>
        )}

        {/* Stats bar */}
        {activeTab === 'tracker' && (
          <StatsBar
            habits={habits} completions={completions}
            getOverallStreak={getOverallStreak}
            getWeeklyCompletionRate={getWeeklyCompletionRate}
            getTodayRate={getTodayRate}
          />
        )}

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <HomePage
                user={user} habits={habits} completions={completions} moods={moods}
                sleepLogs={sleepLogs} journalEntries={journalEntries}
                getOverallStreak={getOverallStreak} getWeeklyCompletionRate={getWeeklyCompletionRate}
                getTodayRate={getTodayRate} getInsights={getInsights}
                onNavigate={setActiveTab} toggleCompletion={toggleCompletion}
              />
            )}
            {activeTab === 'tracker' && (
              <HabitGrid
                habits={habits} completions={completions} toggleCompletion={toggleCompletion}
                getStreakForHabit={getStreakForHabit}
                onAddHabit={() => setShowAddHabit(true)}
                onDeleteHabit={deleteHabit}
              />
            )}
            {activeTab === 'journal' && (
              <Journal
                journalEntries={journalEntries} getJournalEntry={getJournalEntry}
                saveJournalEntry={saveJournalEntry} deleteJournalEntry={deleteJournalEntry}
                habits={habits} completions={completions} moods={moods} sleepLogs={sleepLogs}
              />
            )}
            {activeTab === 'mood' && <MoodTracker moods={moods} logMood={logMood} />}
            {activeTab === 'sleep' && <SleepTracker sleepLogs={sleepLogs} logSleep={logSleep} />}
            {activeTab === 'map' && <ConsistencyMap getHeatmapData={getHeatmapData} habits={habits} />}
            {activeTab === 'circle' && <NetworkDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} onAdd={addHabit} />}
        {showExport && (
          <ExportModal
            onClose={() => setShowExport(false)}
            buildExportData={buildExportData}
            buildMarkdownExport={buildMarkdownExport}
            buildPrintHTML={buildPrintHTML}
          />
        )}
        {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            profile={profile} 
            updateProfile={updateProfile} 
          />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 720px) {
          .desktop-only { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          main { padding: 20px 16px 48px; }
          header > div { padding: 0 16px; }
        }
      `}</style>
    </div>
  )
}
