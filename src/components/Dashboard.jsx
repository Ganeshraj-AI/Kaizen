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
    saveJournalEntry, shareReflectionSnippet, deleteJournalEntry, getJournalEntry, getInsights,
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
        <div className="max-w-[1024px] mx-auto flex items-center h-14 px-4 md:px-8">
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
          <nav className="hidden md:flex flex-1 gap-1">
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

            {/* Mobile hamburger removed, using bottom nav */}
          </div>
        </div>
      </header>



      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="max-w-[1024px] mx-auto px-4 md:px-8 pt-6 pb-24 md:pb-16">

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
                saveJournalEntry={saveJournalEntry} shareReflectionSnippet={shareReflectionSnippet} deleteJournalEntry={deleteJournalEntry}
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

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[var(--color-border)] z-50 px-2 py-2 flex justify-around items-center pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(100,80,180,0.05)]">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${isActive ? 'text-[var(--color-purple)]' : 'text-[var(--color-text-muted)]'}`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mb-0.5 ${isActive ? 'bg-[var(--color-lavender)] text-[var(--color-purple)]' : 'bg-transparent'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[var(--color-purple)]' : ''}`}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </div>
  )
}
