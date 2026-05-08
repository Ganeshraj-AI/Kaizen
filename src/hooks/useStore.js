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

  const buildPrintHTML = useCallback(() => {
    const now = new Date()
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    // ——— Compute meaningful stats ——————————————————————————————————————
    const activeDays = Object.values(
      habits.reduce((acc, h) => {
        Object.keys(completions).filter(k => k.startsWith(h.id + '_')).forEach(k => { acc[k.split('_')[1]] = true })
        return acc
      }, {})
    ).length

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - i)
      return d.toISOString().slice(0, 10)
    })

    const activeLast30 = last30Days.filter(d => habits.some(h => completions[`${h.id}_${d}`])).length

    const bestStreak = (() => {
      let best = 0, cur = 0
      for (let i = 364; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i)
        const iso = d.toISOString().slice(0, 10)
        if (habits.some(h => completions[`${h.id}_${iso}`])) { cur++; best = Math.max(best, cur) } else cur = 0
      }
      return best
    })()

    const topHabit = habits.reduce((best, h) => {
      const done = last30Days.filter(d => completions[`${h.id}_${d}`]).length
      return done > (best?.done || 0) ? { ...h, done } : best
    }, null)

    const avgSleep = (() => {
      const valid = sleepLogs.slice(0, 30).filter(s => s.hours > 0)
      return valid.length ? (valid.reduce((s, l) => s + l.hours, 0) / valid.length).toFixed(1) : null
    })()

    const avgMood = (() => {
      const valid = moods.slice(0, 30)
      return valid.length ? (valid.reduce((s, m) => s + m.mood, 0) / valid.length).toFixed(1) : null
    })()

    const moodLabels = { 5: 'amazing', 4: 'good', 3: 'okay', 2: 'difficult', 1: 'hard' }
    const avgMoodLabel = avgMood ? moodLabels[Math.round(parseFloat(avgMood))] : null

    const bestJournal = journalEntries.find(e => e.reflection?.length > 40) || journalEntries[0]
    const allWins = journalEntries.flatMap(e => e.wins || [])
    const allGratitude = journalEntries.flatMap(e => e.gratitude || [])

    // ——— Narrative paragraphs ——————————————————————————————————————
    const habitNarrative = (() => {
      if (habits.length === 0) return "You haven't started tracking rituals yet. That's okay — every beginning starts somewhere."
      if (activeLast30 === 0) return "This period has been quieter. Rest and pausing are part of any sustainable rhythm. You can always begin again."
      const consistency = Math.round((activeLast30 / 30) * 100)
      if (consistency >= 80) return `You showed up on ${activeLast30} of the last 30 days — a remarkable level of consistency. You're not just tracking habits, you're building identity.`
      if (consistency >= 50) return `You were present on ${activeLast30} of the last 30 days. More than half. That's real, even when it doesn't feel like enough.`
      return `You engaged on ${activeLast30} days this period. Some months are harder. What matters is that you returned — and you're here now.`
    })()

    const moodNarrative = (() => {
      if (!avgMood || moods.length < 3) return "You haven't logged many moods yet. Tracking how you feel — even briefly — can reveal patterns you didn't know were there."
      const score = parseFloat(avgMood)
      const label = avgMoodLabel
      if (score >= 4) return `Your emotional landscape this period was predominantly ${label}. You carried yourself well. On your harder days, you still showed up — and that says something real about your character.`
      if (score >= 3) return `Your average mood was ${label} — mostly in the middle, which is honest and human. Life isn't always dramatic. Sometimes 'okay' is deeply meaningful.`
      return `This has been a harder period emotionally. Your average mood trended toward ${label}. Be gentle with yourself — logging these days takes courage, and recognizing difficulty is the first step through it.`
    })()

    const sleepNarrative = (() => {
      if (!avgSleep) return "Sleep data isn't available for this period. Rest shapes almost everything — how you feel, think, and connect. Consider logging it."
      const hours = parseFloat(avgSleep)
      if (hours >= 7.5) return `You averaged ${avgSleep} hours of sleep — restful and restorative. This shows up everywhere: in your mood, your focus, your patience with yourself. Rest is never wasted.`
      if (hours >= 6) return `You averaged ${avgSleep} hours of sleep this period. Some nights were lighter than ideal, but you kept moving. When rest improves, everything else tends to follow.`
      return `Your sleep has been lighter than ideal this period, averaging ${avgSleep} hours. Your body and mind are telling you something. Deep rest is the foundation everything else is built on.`
    })()

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kaizen — Personal Growth Letter</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }

    html, body {
      width: 210mm; height: 297mm; overflow: hidden;
      background: #FAF9F6; color: #1A1035;
      font-family: 'DM Sans', Arial, sans-serif;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    .page {
      width: 210mm; height: 297mm;
      padding: 24mm 22mm 18mm;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 0;
      overflow: hidden;
    }

    /* ——— Header ——— */
    .header {
      display: flex; justify-content: space-between; align-items: flex-end;
      padding-bottom: 12px; border-bottom: 1.5px solid #1A1035;
      margin-bottom: 4px;
    }
    .wordmark { font-family: 'DM Serif Display', serif; font-size: 40px; letter-spacing: -1.5px; color: #1A1035; line-height: 1; }
    .header-meta { text-align: right; }
    .header-label { font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: #7C5CBF; font-weight: 600; margin-bottom: 2px; }
    .header-date { font-size: 10px; color: #9B93B8; }

    .tagline { font-family: 'DM Serif Display', serif; font-size: 11px; font-style: italic; color: #7C5CBF; margin-top: 8px; margin-bottom: 0; }

    /* ——— Grid body ——— */
    .body { display: grid; grid-template-columns: 1fr 1fr; column-gap: 22px; row-gap: 0; padding-top: 16px; }

    /* ——— Sections ——— */
    .section { padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #EAE6F4; }
    .section:last-child { border-bottom: none; }
    .section-label { font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; color: #7C5CBF; font-weight: 600; margin-bottom: 6px; }

    .section-heading { font-family: 'DM Serif Display', serif; font-size: 16px; color: #1A1035; margin-bottom: 8px; line-height: 1.2; }
    .section-body { font-size: 11px; color: #4A3D72; line-height: 1.65; }

    /* ——— Stat callout ——— */
    .stat-row { display: flex; gap: 12px; margin-bottom: 10px; }
    .stat-block { flex: 1; }
    .stat-num { font-family: 'DM Serif Display', serif; font-size: 28px; color: #1A1035; line-height: 1; letter-spacing: -1px; }
    .stat-desc { font-size: 10px; color: #9B93B8; margin-top: 2px; line-height: 1.4; }

    /* ——— Journal quote ——— */
    .quote-block { padding: 12px 16px; background: rgba(124,92,191,0.04); border-left: 2px solid rgba(196,181,253,0.6); border-radius: 0 8px 8px 0; margin: 8px 0; }
    .quote-text { font-family: 'DM Serif Display', serif; font-size: 12px; font-style: italic; color: #1A1035; line-height: 1.55; }
    .quote-date { font-size: 9px; color: #9B93B8; margin-top: 5px; }

    /* ——— List ——— */
    .item-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
    .item { font-size: 10px; color: #4A3D72; padding: 4px 0; border-bottom: 1px solid rgba(234,230,244,0.5); display: flex; gap: 8px; align-items: flex-start; }
    .item-bullet { color: #7C5CBF; font-size: 8px; margin-top: 3px; flex-shrink: 0; }

    /* ——— Habits row ——— */
    .habit-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: rgba(245,243,255,0.8); border: 1px solid rgba(196,181,253,0.3); border-radius: 99px; font-size: 9px; color: #4A3D72; margin: 2px; }

    /* ——— Footer ——— */
    .footer { border-top: 1px solid #EAE6F4; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-family: 'DM Serif Display', serif; font-size: 12px; color: #C4B5FD; }
    .footer-note { font-size: 9px; color: #C4B5FD; letter-spacing: 0.05em; font-style: italic; }

    @media print {
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div>
    <div class="header">
      <div class="wordmark">Kaizen</div>
      <div class="header-meta">
        <div class="header-label">Personal Growth Letter</div>
        <div class="header-date">${dateStr}</div>
      </div>
    </div>
    <p class="tagline">"Small steps. Lasting change."</p>
  </div>

  <!-- Opening paragraph — full width -->
  <div style="padding: 14px 0 0; border-bottom: 1px solid #EAE6F4; margin-bottom: 0;">
    <p style="font-family: 'DM Serif Display', serif; font-size: 13px; color: #1A1035; line-height: 1.65; font-style: italic; padding-bottom: 14px;">
      ${habitNarrative}
    </p>
  </div>

  <!-- Two-column body -->
  <div class="body">

    <!-- LEFT column -->
    <div>
      <!-- Habits section -->
      <div class="section">
        <div class="section-label">On Habits</div>
        ${habits.length > 0 ? `
          <div class="stat-row">
            <div class="stat-block">
              <div class="stat-num">${habits.length}</div>
              <div class="stat-desc">rituals you're tracking</div>
            </div>
            <div class="stat-block">
              <div class="stat-num">${activeDays}</div>
              <div class="stat-desc">days you showed up</div>
            </div>
            ${bestStreak > 0 ? `
            <div class="stat-block">
              <div class="stat-num">${bestStreak}</div>
              <div class="stat-desc">days in a row at your best</div>
            </div>` : ''}
          </div>
          ${topHabit ? `<p class="section-body">Your most consistent ritual was <strong>${topHabit.name}</strong> — present ${topHabit.done} times in the last 30 days. Some habits quietly become part of who you are.</p>` : ''}
          <div style="margin-top: 8px;">
            ${habits.slice(0, 8).map(h => `<span class="habit-tag">${h.name}</span>`).join('')}
          </div>
        ` : `<p class="section-body">No rituals tracked yet. Begin with one small thing — consistency follows from there.</p>`}
      </div>

      <!-- Mood section -->
      <div class="section">
        <div class="section-label">On Your Emotional Landscape</div>
        ${avgMood ? `
          <div class="stat-row" style="margin-bottom: 8px;">
            <div class="stat-block">
              <div class="stat-num">${avgMood}</div>
              <div class="stat-desc">average mood (out of 5)<br>generally ${avgMoodLabel}</div>
            </div>
            <div class="stat-block">
              <div class="stat-num">${moods.length}</div>
              <div class="stat-desc">feelings logged</div>
            </div>
          </div>
        ` : ''}
        <p class="section-body">${moodNarrative}</p>
      </div>

      <!-- Sleep section -->
      <div class="section" style="border-bottom: none;">
        <div class="section-label">On Rest</div>
        ${avgSleep ? `
          <div class="stat-row" style="margin-bottom: 8px;">
            <div class="stat-block">
              <div class="stat-num">${avgSleep}h</div>
              <div class="stat-desc">average per night<br>${sleepLogs.length} nights logged</div>
            </div>
            <div class="stat-block">
              <div class="stat-num">${sleepLogs.filter(s => s.hours >= 7.5).length}</div>
              <div class="stat-desc">restful nights (7.5h+)</div>
            </div>
          </div>
        ` : ''}
        <p class="section-body">${sleepNarrative}</p>
      </div>
    </div>

    <!-- RIGHT column -->
    <div>
      <!-- Journal section -->
      <div class="section">
        <div class="section-label">From Your Journal</div>
        <p class="section-body" style="margin-bottom: 8px;">
          ${journalEntries.length > 0
            ? `You wrote ${journalEntries.length} ${journalEntries.length === 1 ? 'entry' : 'entries'}. Writing is how we make sense of what we're living through.`
            : `Your journal is waiting. Even a single sentence — how you felt, what you noticed — becomes something meaningful to return to.`}
        </p>
        ${bestJournal?.reflection ? `
          <div class="quote-block">
            <div class="quote-text">"${bestJournal.reflection.slice(0, 280)}${bestJournal.reflection.length > 280 ? '…' : ''}"</div>
            ${bestJournal.date ? `<div class="quote-date">— ${bestJournal.date}</div>` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Wins -->
      ${allWins.length > 0 ? `
      <div class="section">
        <div class="section-label">Wins Worth Remembering</div>
        <div class="item-list">
          ${allWins.slice(0, 5).map(w => `
            <div class="item">
              <span class="item-bullet">◆</span>
              <span>${w}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Gratitude -->
      ${allGratitude.length > 0 ? `
      <div class="section">
        <div class="section-label">Moments of Gratitude</div>
        <div class="item-list">
          ${allGratitude.slice(0, 4).map(g => `
            <div class="item">
              <span class="item-bullet">♡</span>
              <span>${g}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Closing note -->
      <div style="padding: 12px 16px; background: rgba(124,92,191,0.04); border-radius: 10px; border: 1px solid rgba(196,181,253,0.2); margin-top: 8px;">
        <p style="font-family: 'DM Serif Display', serif; font-size: 12px; font-style: italic; color: #4A3D72; line-height: 1.6;">
          Growth isn't linear, and it isn't always visible. But you are here. You are paying attention. That is the whole practice.
        </p>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="footer-brand">Kaizen</span>
    <span class="footer-note">Gentle self-improvement, without shame.</span>
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
