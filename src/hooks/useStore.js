/**
 * useStore â€“ unified data layer
 * Works with Supabase when configured, falls back to localStorage demo mode.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// â”€â”€â”€ localStorage helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LS = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
}

const DEMO_USER = { id: 'demo', email: 'demo@kaizen.app', name: 'You' }

const DEFAULT_HABITS = [
  { id: 'h1', name: 'Morning pages', emoji: 'ðŸ““', color: '#8B5CF6', category: 'Mind', created_at: new Date().toISOString() },
  { id: 'h2', name: 'Move your body', emoji: 'ðŸƒ', color: '#84A98C', category: 'Body', created_at: new Date().toISOString() },
  { id: 'h3', name: 'Drink water', emoji: 'ðŸ’§', color: '#7DD3FC', category: 'Body', created_at: new Date().toISOString() },
]

// â”€â”€â”€ Date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const formatDate = (isoDate) => {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export const formatDateFull = (isoDate) => {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// â”€â”€â”€ Export helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function exportMarkdown(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function exportPrintHTML(html) {
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.print() }, 500)
}

// â”€â”€â”€ Main hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useStore() {
  const [user, setUser] = useState(null)
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [moods, setMoods] = useState([])
  const [sleepLogs, setSleepLogs] = useState([])
  const [reflections, setReflections] = useState({})
  const [journalEntries, setJournalEntries] = useState([]) // Full journal entries
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('login')

  const [isDemo, setIsDemo] = useState(() => {
    return !isSupabaseConfigured || LS.get('kaizen_demo_mode') === true
  })

  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (isDemo) {
      const saved = LS.get('kaizen_user')
      if (saved) setUser(saved)
      setLoading(false)
      if (!isSupabaseConfigured) return
    }
    
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isDemo || !LS.get('kaizen_demo_mode')) {
          setUser(session?.user ?? null)
        }
        setLoading(false)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isDemo || !LS.get('kaizen_demo_mode')) {
          setUser(session?.user ?? null)
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [isDemo])

  // â”€â”€ Load data when user changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user) {
      setHabits([]); setCompletions({}); setMoods([])
      setSleepLogs([]); setReflections({}); setJournalEntries([])
      return
    }
    if (isDemo) {
      const uid = user.id
      setHabits(LS.get(`kaizen_habits_${uid}`, DEFAULT_HABITS))
      setCompletions(LS.get(`kaizen_completions_${uid}`, {}))
      setMoods(LS.get(`kaizen_moods_${uid}`, []))
      setSleepLogs(LS.get(`kaizen_sleep_${uid}`, []))
      setReflections(LS.get(`kaizen_reflections_${uid}`, {}))
      setReflections(LS.get(`kaizen_reflections_${uid}`, {}))
      setJournalEntries(LS.get(`kaizen_journal_${uid}`, []))
      setProfile(LS.get(`kaizen_profile_${uid}`, { kaizen_id: 'KZN-DEMO', username: 'demo_user', display_name: 'You', private_growth_mode: false }))
    } else {
      loadFromSupabase(user.id)
    }
  }, [user])

  async function loadFromSupabase(uid) {
    const [
      { data: habitsData },
      { data: compData },
      { data: moodsData },
      { data: sleepData },
      { data: refData },
      { data: journalData },
      { data: profileData },
    ] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('habit_completions').select('*').eq('user_id', uid),
      supabase.from('mood_logs').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('sleep_logs').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('reflections').select('*').eq('user_id', uid),
      supabase.from('journal_entries').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', uid).single(),
    ])
    setHabits(habitsData || [])
    const compMap = {}
    ;(compData || []).forEach(c => { compMap[`${c.habit_id}_${c.date}`] = true })
    setCompletions(compMap)
    setMoods(moodsData || [])
    setSleepLogs(sleepData || [])
    const refMap = {}
    ;(refData || []).forEach(r => { refMap[r.date] = r.content })
    setReflections(refMap)
    setJournalEntries(journalData || [])
    if (profileData) setProfile(profileData)
  }

  const updateProfile = async (updates) => {
    if (isDemo) {
      const updated = { ...profile, ...updates }
      setProfile(updated)
      LS.set(`kaizen_profile_${user.id}`, updated)
      return { error: null }
    }
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (!error && data) setProfile(data)
    return { error }
  }


  // â”€â”€ Auth actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const signUp = async (email, password, name) => {
    if (isDemo) {
      const u = { ...DEMO_USER, email, name: name || 'You' }
      LS.set('kaizen_user', u)
      setUser(u)
      return { error: null }
    }
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    return { error }
  }

  const signIn = async (email, password) => {
    if (isDemo) {
      const u = { ...DEMO_USER, email }
      LS.set('kaizen_user', u)
      setUser(u)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const enterDemoMode = () => {
    LS.set('kaizen_demo_mode', true)
    setIsDemo(true)
    const u = { ...DEMO_USER }
    LS.set('kaizen_user', u)
    setUser(u)
  }

  const signOut = async () => {
    if (isDemo) { 
      LS.set('kaizen_user', null)
      if (isSupabaseConfigured) {
        LS.set('kaizen_demo_mode', false)
        setIsDemo(false)
      }
      setUser(null)
      return 
    }
    await supabase.auth.signOut()
  }

  // ——— Habit CRUD ———————————————————————————————————————————————————————————
  const addHabit = async ({ name, emoji, color, category, visibility }) => {
    const habit = {
      id: `h_${Date.now()}`, user_id: user.id,
      name, emoji: emoji || '✨', color: color || '#8B5CF6',
      category: category || 'General', visibility: visibility || 'private',
      created_at: new Date().toISOString(),
    }
    if (isDemo) {
      const updated = [...habits, habit]
      setHabits(updated)
      LS.set(`kaizen_habits_${user.id}`, updated)
      return { error: null }
    }
    const { id, ...dbHabit } = habit
    const { data, error } = await supabase.from('habits').insert([dbHabit]).select().single()
    if (!error) setHabits(prev => [...prev, data])
    return { error }
  }

  const deleteHabit = async (habitId) => {
    if (isDemo) {
      const updated = habits.filter(h => h.id !== habitId)
      setHabits(updated)
      LS.set(`kaizen_habits_${user.id}`, updated)
      const newComp = { ...completions }
      Object.keys(newComp).forEach(k => { if (k.startsWith(habitId + '_')) delete newComp[k] })
      setCompletions(newComp)
      LS.set(`kaizen_completions_${user.id}`, newComp)
      return
    }
    await supabase.from('habits').delete().eq('id', habitId)
    setHabits(prev => prev.filter(h => h.id !== habitId))
    setCompletions(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(k => { if (k.startsWith(habitId + '_')) delete n[k] })
      return n
    })
  }

  // â”€â”€ Completion toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleCompletion = async (habitId, date) => {
    const key = `${habitId}_${date}`
    const isNowComplete = !completions[key]
    setCompletions(prev => {
      const n = { ...prev }
      if (isNowComplete) n[key] = true
      else delete n[key]
      if (isDemo) LS.set(`kaizen_completions_${user.id}`, n)
      return n
    })
    if (!isDemo) {
      if (isNowComplete) {
        await supabase.from('habit_completions').upsert({ habit_id: habitId, user_id: user.id, date })
      } else {
        await supabase.from('habit_completions').delete().eq('habit_id', habitId).eq('date', date)
      }
    }
  }

  // â”€â”€ Mood â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const logMood = async (mood, note = '') => {
    const date = todayISO()
    const entry = { date, mood, note, logged_at: new Date().toISOString() }
    if (isDemo) {
      const updated = [entry, ...moods.filter(m => m.date !== date)]
      setMoods(updated)
      LS.set(`kaizen_moods_${user.id}`, updated)
      return { error: null }
    }
    const { error } = await supabase.from('mood_logs').upsert({ user_id: user.id, ...entry })
    if (!error) setMoods(prev => [entry, ...prev.filter(m => m.date !== date)])
    return { error }
  }

  // â”€â”€ Sleep â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const logSleep = async (hours) => {
    const date = todayISO()
    const entry = { date, hours: parseFloat(hours) }
    if (isDemo) {
      const updated = [entry, ...sleepLogs.filter(s => s.date !== date)]
      setSleepLogs(updated)
      LS.set(`kaizen_sleep_${user.id}`, updated)
      return { error: null }
    }
    const { error } = await supabase.from('sleep_logs').upsert({ user_id: user.id, ...entry })
    if (!error) setSleepLogs(prev => [entry, ...prev.filter(s => s.date !== date)])
    return { error }
  }

  // â”€â”€ Reflection (kept for backward compat) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveReflection = async (text) => {
    const date = todayISO()
    if (isDemo) {
      const updated = { ...reflections, [date]: text }
      setReflections(updated)
      LS.set(`kaizen_reflections_${user.id}`, updated)
      return { error: null }
    }
    const { error } = await supabase.from('reflections').upsert({ user_id: user.id, date, content: text })
    if (!error) setReflections(prev => ({ ...prev, [date]: text }))
    return { error }
  }

  // â”€â”€ Journal CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveJournalEntry = async (entry) => {
    const now = new Date().toISOString()
    const existing = journalEntries.find(e => e.date === entry.date)
    const record = {
      ...entry,
      user_id: user.id,
      id: existing?.id || `j_${Date.now()}`,
      created_at: existing?.created_at || now,
      updated_at: now,
    }
    if (isDemo) {
      const updated = [record, ...journalEntries.filter(e => e.date !== entry.date)]
      setJournalEntries(updated)
      LS.set(`kaizen_journal_${user.id}`, updated)
      return { error: null, data: record }
    }
    
    const { id, ...dbRecord } = record
    if (existing?.id) dbRecord.id = existing.id
    
    const { data, error } = await supabase.from('journal_entries').upsert(dbRecord).select().single()
    if (!error) {
      setReflections(prev => ({ ...prev, [entry.date]: dbRecord.reflection }))
      setJournalEntries(prev => {
        const idx = prev.findIndex(x => x.date === entry.date)
        if (idx >= 0) return [...prev.slice(0, idx), data, ...prev.slice(idx + 1)]
        return [data, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
      })
    }
    return { data, error }
  }

  const shareReflectionSnippet = async (journalId, type, content) => {
    if (isDemo) return { error: null }
    const { error } = await supabase.from('shared_reflections').insert([{
      user_id: user.id,
      journal_id: journalId,
      snippet_type: type,
      content
    }])
    return { error }
  }

  const deleteJournalEntry = async (date) => {
    if (isDemo) {
      const updated = journalEntries.filter(e => e.date !== date)
      setJournalEntries(updated)
      LS.set(`kaizen_journal_${user.id}`, updated)
      return
    }
    const entry = journalEntries.find(e => e.date === date)
    if (entry) await supabase.from('journal_entries').delete().eq('id', entry.id)
    setJournalEntries(prev => prev.filter(e => e.date !== date))
  }

  const getJournalEntry = useCallback((date) => {
    return journalEntries.find(e => e.date === date) || null
  }, [journalEntries])

  // ——— Cross-data Insights ———————————————————————————————————————————————————————————
  const getInsights = useCallback(() => {
    const insights = []
    if (habits.length === 0 || moods.length < 3) return insights

    // Mood vs habit correlation
    const moodHabitData = moods.slice(0, 30).map(m => {
      const habitsDone = habits.filter(h => completions[`${h.id}_${m.date}`]).length
      return { mood: m.mood, done: habitsDone, date: m.date }
    }).filter(d => d.done > 0)

    if (moodHabitData.length >= 3) {
      const highHabitDays = moodHabitData.filter(d => d.done >= habits.length * 0.7)
      const avgMoodHighHabit = highHabitDays.length > 0
        ? highHabitDays.reduce((s, d) => s + d.mood, 0) / highHabitDays.length : 0
      const lowHabitDays = moodHabitData.filter(d => d.done < habits.length * 0.4)
      const avgMoodLowHabit = lowHabitDays.length > 0
        ? lowHabitDays.reduce((s, d) => s + d.mood, 0) / lowHabitDays.length : 0
      if (avgMoodHighHabit > avgMoodLowHabit + 0.5) {
        insights.push('You tend to feel calmer on days you complete more habits ✨')
      }
    }

    // Sleep vs mood
    if (sleepLogs.length >= 3 && moods.length >= 3) {
      const sleepMoodPairs = sleepLogs.slice(0, 14).map(s => {
        const mood = moods.find(m => m.date === s.date)
        return mood ? { sleep: s.hours, mood: mood.mood } : null
      }).filter(Boolean)
      if (sleepMoodPairs.length >= 3) {
        const goodSleep = sleepMoodPairs.filter(p => p.sleep >= 7.5)
        const avgMoodGoodSleep = goodSleep.length > 0
          ? goodSleep.reduce((s, p) => s + p.mood, 0) / goodSleep.length : 0
        if (avgMoodGoodSleep >= 4) {
          insights.push('Your best weeks include more restful sleep 🌙')
        }
      }
    }

    // Journaling consistency
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toISOString().slice(0, 10)
    })
    const journaledDays = last14.filter(d => journalEntries.some(e => e.date === d)).length
    if (journaledDays >= 7) {
      insights.push('Journaling regularly keeps you grounded — keep going 📖')
    }

    return insights.slice(0, 3)
  }, [habits, completions, moods, sleepLogs, journalEntries])

  // ——— Computed stats ———————————————————————————————————————————————————————————
  const getStreakForHabit = useCallback((habitId) => {
    let streak = 0, best = 0, current = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      if (completions[`${habitId}_${iso}`]) {
        current++
        if (i === 0 || i === 1) streak = current
        best = Math.max(best, current)
      } else { if (i > 1) current = 0 }
    }
    return { current: streak, best }
  }, [completions])

  const getOverallStreak = useCallback(() => {
    if (habits.length === 0) return { current: 0, best: 0 }
    const today = new Date()
    let streak = 0, best = 0, cur = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const anyDone = habits.some(h => completions[`${h.id}_${iso}`])
      if (anyDone) {
        cur++
        if (i === 0 || i === 1) streak = cur
        best = Math.max(best, cur)
      } else { if (i > 1) cur = 0 }
    }
    return { current: streak, best }
  }, [habits, completions])

  const getWeeklyCompletionRate = useCallback(() => {
    if (habits.length === 0) return 0
    const today = new Date()
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      habits.forEach(h => { if (completions[`${h.id}_${iso}`]) done++ })
    }
    return Math.round((done / (habits.length * 7)) * 100)
  }, [habits, completions])

  const getHeatmapData = useCallback(() => {
    const today = new Date()
    const data = {}
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      data[iso] = habits.filter(h => completions[`${h.id}_${iso}`]).length
    }
    return data
  }, [habits, completions])

  const getTodayRate = useCallback(() => {
    if (habits.length === 0) return 0
    const today = todayISO()
    const done = habits.filter(h => completions[`${h.id}_${today}`]).length
    return Math.round((done / habits.length) * 100)
  }, [habits, completions])

  // ——— Export ———————————————————————————————————————————————————————————
  const buildExportData = useCallback(() => ({
    exported_at: new Date().toISOString(),
    habits,
    completions,
    mood_logs: moods,
    sleep_logs: sleepLogs,
    journal_entries: journalEntries,
    reflections,
  }), [habits, completions, moods, sleepLogs, journalEntries, reflections])

  const buildMarkdownExport = useCallback(() => {
    const lines = ['# Kaizen – Life Journal Export', `_Exported on ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}_`, '']
    lines.push('## Habits', '')
    habits.forEach(h => lines.push(`- ${h.emoji} **${h.name}** (${h.category})`))
    lines.push('')
    if (journalEntries.length > 0) {
      lines.push('## Journal Entries', '')
      journalEntries.forEach(e => {
        lines.push(`### ${formatDateFull(e.date)}`)
        if (e.title) lines.push(`**${e.title}**`, '')
        if (e.mood) lines.push(`Mood: ${'★ '.repeat(e.mood)}`, '')
        if (e.reflection) lines.push(`${e.reflection}`, '')
        if (e.wins?.length) { lines.push('**Wins:**'); e.wins.forEach(w => lines.push(`- ${w}`)); lines.push('') }
        if (e.struggles?.length) { lines.push('**Struggles:**'); e.struggles.forEach(s => lines.push(`- ${s}`)); lines.push('') }
        if (e.gratitude?.length) { lines.push('**Gratitude:**'); e.gratitude.forEach(g => lines.push(`- ${g}`)); lines.push('') }
        if (e.notes) lines.push(`*${e.notes}*`, '')
        lines.push('---', '')
      })
    }
    if (moods.length > 0) {
      lines.push('## Mood Log', '')
      moods.slice(0, 30).forEach(m => {
        const labels = ['', 'Hard', 'Low', 'Okay', 'Good', 'Amazing']
        lines.push(`- **${formatDate(m.date)}**: ${labels[m.mood]}${m.note ? ` — ${m.note}` : ''}`)
      })
      lines.push('')
    }
    return lines.join('\n')
  }, [habits, journalEntries, moods])

  const buildPrintHTML = useCallback((type = 'pdf_monthly') => {
    const now = new Date()
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const todayISOStr = todayISO()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - i)
      return d.toISOString().slice(0, 10)
    }).reverse()

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - i)
      return d.toISOString().slice(0, 10)
    }).reverse()

    const moodLabels = { 5: 'amazing', 4: 'good', 3: 'okay', 2: 'difficult', 1: 'hard' }

    let title, subtitle, narrative, contentHTML = ''

    if (type === 'pdf_daily') {
      title = "Daily Reflection"
      subtitle = dateStr
      
      const todayJournal = journalEntries.find(e => e.date === todayISOStr)
      const todayMood = moods.find(m => m.date === todayISOStr)
      const todayHabits = habits.filter(h => completions[`${h.id}_${todayISOStr}`])
      
      const moodText = todayMood ? moodLabels[todayMood.mood] : 'quiet'
      narrative = todayHabits.length > 0 ? `Momentum formed softly today. You returned to your rhythm, completing ${todayHabits.length} ${todayHabits.length === 1 ? 'ritual' : 'rituals'}.` : "A quieter day, but still moving. Rest and pausing are part of any sustainable rhythm."

      contentHTML = `
        <div class="card">
          <div class="section-label">Emotional Landscape</div>
          <p class="narrative-text">You felt <strong>${moodText}</strong> today. ${todayMood?.note ? `"${todayMood.note}"` : "Every feeling has its place."}</p>
        </div>
        
        <div class="card">
          <div class="section-label">Today's Rhythm</div>
          ${todayHabits.length > 0 ? `
            <div class="rhythm-tags">
              ${todayHabits.map(h => `<span class="tag">${h.name}</span>`).join('')}
            </div>
            <p class="sub-text">Consistency quietly deepened.</p>
          ` : `<p class="narrative-text">No rituals completed today. The rhythm can continue tomorrow.</p>`}
        </div>
        
        ${todayJournal ? `
        <div class="card" style="grid-column: 1 / -1;">
          <div class="section-label">Reflection</div>
          <div class="quote-block">
            <p class="quote-text">"${todayJournal.reflection || "No reflection written today."}"</p>
          </div>
          ${todayJournal.gratitude?.length ? `
            <div style="margin-top: 16px;">
              <div class="section-label">Gratitude</div>
              ${todayJournal.gratitude.map(g => `<p class="item-text">• ${g}</p>`).join('')}
            </div>
          ` : ''}
        </div>
        ` : ''}
      `
    } else if (type === 'pdf_weekly') {
      title = "Weekly Rhythm"
      subtitle = `Week of ${dateStr}`
      
      const activeDays = last7Days.filter(d => habits.some(h => completions[`${h.id}_${d}`])).length
      
      narrative = activeDays >= 4 ? "A steady week. Your rhythm became steadier and you kept returning." : "A softer rhythm formed this week. A calmer momentum still matters."

      const moodAverages = last7Days.map(d => moods.find(m => m.date === d)?.mood).filter(Boolean)
      const avgMood = moodAverages.length ? (moodAverages.reduce((a,b)=>a+b,0)/moodAverages.length).toFixed(1) : null
      
      contentHTML = `
        <div class="card">
          <div class="section-label">The Week's Flow</div>
          <p class="narrative-text">You returned <strong>${activeDays} times</strong> this week. Consistency isn't about perfection, it's about returning.</p>
        </div>
        
        ${avgMood ? `
        <div class="card">
          <div class="section-label">Emotional Tone</div>
          <p class="narrative-text">Your emotional tone averaged around <strong>${moodLabels[Math.round(avgMood)] || 'okay'}</strong>. You stayed present through it.</p>
        </div>` : ''}
        
        <div class="card" style="grid-column: 1 / -1;">
          <div class="section-label">Rhythm Timeline</div>
          <div style="display: flex; gap: 8px; margin-top: 12px; justify-content: space-between; padding: 0 16px;">
            ${last7Days.map(d => {
              const count = habits.filter(h => completions[`${h.id}_${d}`]).length
              const dayName = new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
              const intensity = Math.min(count / Math.max(habits.length, 1), 1)
              return `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent); opacity: ${intensity > 0 ? 0.3 + (intensity * 0.7) : 0.05}; box-shadow: 0 4px 12px rgba(130, 110, 156, ${intensity * 0.3});"></div>
                  <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em;">${dayName}</span>
                </div>
              `
            }).join('')}
          </div>
        </div>
      `
    } else {
      // Monthly Chapter
      const monthNum = new Date().getMonth() + 1
      title = `Chapter ${monthNum.toString().padStart(2, '0')} — Quiet Becoming`
      subtitle = monthName
      
      const activeLast30 = last30Days.filter(d => habits.some(h => completions[`${h.id}_${d}`])).length
      narrative = activeLast30 >= 15 ? "Consistency quietly deepened this month. You built a space of emotional continuity." : "A month of quiet recovery. You returned slowly, and that is enough."

      const topHabits = habits.map(h => ({
        ...h,
        count: last30Days.filter(d => completions[`${h.id}_${d}`]).length
      })).sort((a,b) => b.count - a.count).slice(0, 3)

      const highlights = journalEntries.filter(e => last30Days.includes(e.date) && e.reflection?.length > 20).slice(0, 2)

      contentHTML = `
        <div class="card">
          <div class="section-label">Monthly Rhythm</div>
          <p class="narrative-text">You returned to your practices on <strong>${activeLast30} days</strong> this month. Every return is a moment of self-respect.</p>
        </div>
        
        <div class="card">
          <div class="section-label">Strongest Rhythms</div>
          <div class="rhythm-tags">
            ${topHabits.filter(h => h.count > 0).map(h => `<span class="tag">${h.name} (${h.count}x)</span>`).join('')}
          </div>
        </div>
        
        ${highlights.length > 0 ? `
        <div class="card" style="grid-column: 1 / -1;">
          <div class="section-label">Moments that Mattered</div>
          <div style="display: grid; gap: 20px; grid-template-columns: 1fr 1fr;">
            ${highlights.map(h => `
              <div class="quote-block">
                <p class="quote-text">"${h.reflection.slice(0, 150)}${h.reflection.length > 150 ? '...' : ''}"</p>
                <div class="quote-date">— ${new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      `
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #F8F7F4;
      --card-bg: rgba(255, 255, 255, 0.7);
      --text-primary: #2C2834;
      --text-secondary: #6B637B;
      --accent: #826E9C;
      --accent-light: rgba(130, 110, 156, 0.08);
      --border: rgba(130, 110, 156, 0.15);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }

    html, body {
      width: 210mm; min-height: 297mm;
      background: var(--bg-color);
      color: var(--text-primary);
      font-family: 'DM Sans', sans-serif;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 60vh;
      background: linear-gradient(180deg, rgba(230,225,238,0.5) 0%, rgba(248,247,244,0) 100%);
      z-index: -1;
    }

    .page {
      width: 210mm; min-height: 297mm;
      padding: 32mm 24mm 24mm;
      display: flex; flex-direction: column;
      position: relative;
    }

    .header {
      margin-bottom: 32px;
      text-align: center;
    }
    .title {
      font-family: 'DM Serif Display', serif;
      font-size: 38px;
      color: var(--text-primary);
      line-height: 1.1;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 12px;
    }

    .narrative-lead {
      font-family: 'DM Serif Display', serif;
      font-size: 18px;
      color: var(--text-primary);
      line-height: 1.6;
      font-style: italic;
      text-align: center;
      max-width: 80%;
      margin: 0 auto 48px;
      color: #4A4258;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      flex: 1;
    }
    ${type === 'pdf_daily' ? '.content-grid { display: flex; flex-direction: column; max-width: 85%; margin: 0 auto; width: 100%; }' : ''}

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.02);
      backdrop-filter: blur(10px);
    }
    .section-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 16px;
    }
    .narrative-text {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);
    }
    .sub-text {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 10px;
      font-style: italic;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      background: var(--accent-light);
      border-radius: 99px;
      font-size: 12px;
      color: var(--text-primary);
      margin: 4px;
      border: 1px solid var(--border);
      font-weight: 500;
    }
    .rhythm-tags {
      margin: -4px;
    }

    .quote-block {
      padding-left: 20px;
      border-left: 2px solid var(--accent);
    }
    .quote-text {
      font-family: 'DM Serif Display', serif;
      font-size: 17px;
      font-style: italic;
      color: var(--text-primary);
      line-height: 1.5;
    }
    .quote-date {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 10px;
      font-weight: 500;
    }
    
    .item-text {
      font-size: 14px;
      color: var(--text-primary);
      padding: 6px 0;
      line-height: 1.5;
    }

    .footer {
      margin-top: auto;
      padding-top: 48px;
      text-align: center;
      font-family: 'DM Serif Display', serif;
      font-size: 15px;
      color: var(--accent);
      font-style: italic;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="subtitle">${subtitle}</div>
    <div class="title">${title}</div>
  </div>
  
  <p class="narrative-lead">${narrative}</p>

  <div class="content-grid">
    ${contentHTML}
  </div>

  <div class="footer">
    Kaizen — Quietly becoming.
  </div>
</div>
</body>
</html>`
  }, [habits, completions, moods, sleepLogs, journalEntries])

  return {
    user, profile, loading, habits, completions, moods, sleepLogs, reflections, journalEntries,

    authMode, setAuthMode, isDemo, enterDemoMode,
    signUp, signIn, signOut, updateProfile,
    addHabit, deleteHabit, toggleCompletion,
    logMood, logSleep, saveReflection,
    saveJournalEntry, shareReflectionSnippet, deleteJournalEntry, getJournalEntry,
    getInsights,
    getStreakForHabit, getOverallStreak, getWeeklyCompletionRate,
    getHeatmapData, getTodayRate,
    buildExportData, buildMarkdownExport, buildPrintHTML,
  }
}
