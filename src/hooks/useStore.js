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

  const buildPrintHTML = useCallback((mode = 'monthly') => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const todayIso = now.toISOString().slice(0, 10)

    let title, subtitle, timeframe
    if (mode === 'daily') {
      title = 'Daily Reflection'
      subtitle = 'A calm snapshot of today.'
      timeframe = 1
    } else if (mode === 'weekly') {
      title = 'Weekly Rhythm'
      subtitle = 'A cinematic summary of your week.'
      timeframe = 7
    } else {
      title = 'Monthly Chapter'
      subtitle = 'A reflection chapter of your life.'
      timeframe = 30
    }

    const pastDays = Array.from({ length: timeframe }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - i)
      return d.toISOString().slice(0, 10)
    })

    const activeDaysCount = pastDays.filter(d => habits.some(h => completions[`${h.id}_${d}`])).length
    const consistencyPct = Math.round((activeDaysCount / timeframe) * 100) || 0

    let rhythmMessage = ""
    if (timeframe === 1) {
      if (activeDaysCount > 0) rhythmMessage = "Momentum formed softly today. You showed up."
      else rhythmMessage = "A quieter day, but still moving. Rest is part of the rhythm."
    } else {
      if (consistencyPct >= 80) rhythmMessage = "A remarkable rhythm. You kept returning, and it shows."
      else if (consistencyPct >= 50) rhythmMessage = "A steady momentum. Consistency quietly deepened."
      else rhythmMessage = "A softer rhythm formed. You are still becoming."
    }

    const topHabit = habits.reduce((best, h) => {
      const done = pastDays.filter(d => completions[`${h.id}_${d}`]).length
      return done > (best?.done || 0) ? { ...h, done } : best
    }, null)

    const relevantMoods = moods.filter(m => pastDays.includes(m.date))
    const avgMood = relevantMoods.length ? (relevantMoods.reduce((s, m) => s + m.mood, 0) / relevantMoods.length).toFixed(1) : null
    
    let emotionalMessage = "Emotions are the weather of the mind."
    if (avgMood) {
      const score = parseFloat(avgMood)
      if (score >= 4) emotionalMessage = "Your emotional landscape was predominantly bright. You carried yourself well."
      else if (score >= 3) emotionalMessage = "Your mood was gently balanced. Life isn't always dramatic, and 'okay' is deeply meaningful."
      else emotionalMessage = "A heavier emotional period. Be gentle with yourself — recognizing difficulty is courage."
    }

    const relevantJournals = journalEntries.filter(e => pastDays.includes(e.date))
    const bestJournal = relevantJournals.find(e => e.reflection?.length > 40) || relevantJournals[0]
    const wins = relevantJournals.flatMap(e => e.wins || [])
    const gratitude = relevantJournals.flatMap(e => e.gratitude || [])

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kaizen — ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }

    html, body {
      width: 210mm; height: 297mm; overflow: hidden;
      background: linear-gradient(145deg, #FDFCFB 0%, #F4F1FA 100%);
      color: #1A1035;
      font-family: 'Inter', sans-serif;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    .page {
      width: 210mm; height: 297mm;
      padding: 24mm;
      display: flex; flex-direction: column;
      position: relative;
    }

    /* Ambient background blobs for emotional depth */
    .bg-glow-1 { position: absolute; top: -50mm; right: -50mm; width: 150mm; height: 150mm; background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%); border-radius: 50%; z-index: 0; }
    .bg-glow-2 { position: absolute; bottom: -20mm; left: -20mm; width: 200mm; height: 200mm; background: radial-gradient(circle, rgba(196,181,253,0.12) 0%, transparent 70%); border-radius: 50%; z-index: 0; }

    .content-wrapper { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

    /* Header */
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px;
    }
    .header-left { flex: 1; }
    .brand { font-family: 'DM Serif Display', serif; font-size: 20px; color: #7C3AED; margin-bottom: 24px; opacity: 0.8; }
    .title { font-family: 'DM Serif Display', serif; font-size: 46px; line-height: 1.1; color: #1A1035; margin-bottom: 6px; letter-spacing: -0.02em; }
    .subtitle { font-size: 14px; color: #6D638C; font-weight: 400; letter-spacing: 0.02em; font-style: italic; }
    
    .header-right { text-align: right; }
    .date-badge { display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(139,92,246,0.15); border-radius: 20px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #5B4A82; font-weight: 600; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }

    /* Narrative Section */
    .narrative-card {
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.8);
      border-radius: 16px;
      padding: 24px 32px;
      margin-bottom: 28px;
      box-shadow: 0 10px 40px rgba(139,92,246,0.04), inset 0 1px 0 rgba(255,255,255,1);
    }
    .narrative-text {
      font-family: 'DM Serif Display', serif;
      font-size: 20px; color: #2D234A; line-height: 1.6; font-style: italic;
    }

    /* Grid Layout */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; flex: 1; }

    .card {
      background: rgba(255,255,255,0.5);
      border: 1px solid rgba(139,92,246,0.1);
      border-radius: 16px;
      padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
    }

    .card-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #7C3AED; font-weight: 600; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .card-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(139,92,246,0.2), transparent); }

    .stat-val { font-family: 'DM Serif Display', serif; font-size: 42px; color: #1A1035; line-height: 1; margin-bottom: 4px; }
    .stat-label { font-size: 12px; color: #6D638C; line-height: 1.4; }

    .quote-box {
      position: relative;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(139,92,246,0.05), transparent);
      border-left: 2px solid #8B5CF6;
      border-radius: 0 12px 12px 0;
      margin-top: 8px;
    }
    .quote-text { font-family: 'DM Serif Display', serif; font-size: 16px; color: #2D234A; line-height: 1.6; font-style: italic; }

    /* Lists */
    .list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
    .list-item { font-size: 13px; color: #3A2F5A; display: flex; align-items: flex-start; gap: 12px; line-height: 1.5; }
    .bullet { color: #8B5CF6; font-size: 14px; margin-top: -2px; }

    /* Footer */
    .footer {
      margin-top: auto; padding-top: 24px;
      border-top: 1px solid rgba(139,92,246,0.1);
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-text { font-size: 10px; color: #9B93B8; letter-spacing: 0.05em; }
    .footer-brand { font-family: 'DM Serif Display', serif; font-size: 14px; color: #7C3AED; opacity: 0.6; }

  </style>
</head>
<body>
  <div class="page">
    <div class="bg-glow-1"></div>
    <div class="bg-glow-2"></div>
    
    <div class="content-wrapper">
      <div class="header">
        <div class="header-left">
          <div class="brand">Kaizen</div>
          <h1 class="title">${title}</h1>
          <p class="subtitle">${subtitle}</p>
        </div>
        <div class="header-right">
          <div class="date-badge">${dateStr}</div>
        </div>
      </div>

      <div class="narrative-card">
        <p class="narrative-text">${rhythmMessage}</p>
      </div>

      <div class="grid">
        <!-- Left Column -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <div class="card">
            <div class="card-title">Continuity</div>
            <div style="display: flex; gap: 24px; align-items: center;">
              <div>
                <div class="stat-val">${consistencyPct}%</div>
                <div class="stat-label">rhythm maintained</div>
              </div>
              <div style="width: 1px; height: 40px; background: rgba(139,92,246,0.1);"></div>
              <div>
                <div class="stat-val">${activeDaysCount}</div>
                <div class="stat-label">days present</div>
              </div>
            </div>
            ${topHabit ? \`<p style="font-size: 13px; color: #6D638C; margin-top: 8px; line-height: 1.5;">Your strongest anchor was <strong>\${topHabit.name}</strong>. It grounds you.</p>\` : ''}
          </div>

          <div class="card">
            <div class="card-title">Emotional Landscape</div>
            ${avgMood ? \`<div class="stat-val">\${avgMood}</div>\` : ''}
            <p style="font-size: 13px; color: #6D638C; line-height: 1.5;">\${emotionalMessage}</p>
          </div>

          ${wins.length > 0 ? \`
          <div class="card" style="flex: 1;">
            <div class="card-title">Moments of Light</div>
            <div class="list">
              \${wins.slice(0, 4).map(w => \`<div class="list-item"><span class="bullet">✧</span><span>\${w}</span></div>\`).join('')}
            </div>
          </div>
          \` : ''}

        </div>

        <!-- Right Column -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <div class="card">
            <div class="card-title">From Your Journal</div>
            ${bestJournal?.reflection ? \`
              <div class="quote-box">
                <p class="quote-text">"\${bestJournal.reflection.slice(0, 320)}\${bestJournal.reflection.length > 320 ? '...' : ''}"</p>
              </div>
            \` : \`<p style="font-size: 13px; color: #6D638C; font-style: italic;">The pages were quiet during this time. Silence is part of the journey too.</p>\`}
          </div>

          ${gratitude.length > 0 ? \`
          <div class="card" style="flex: 1;">
            <div class="card-title">Gratitude Anchors</div>
            <div class="list">
              \${gratitude.slice(0, 5).map(g => \`<div class="list-item"><span class="bullet">♡</span><span>\${g}</span></div>\`).join('')}
            </div>
          </div>
          \` : \`
          <div class="card" style="flex: 1; justify-content: center; align-items: center; text-align: center; opacity: 0.7;">
            <p style="font-family: 'DM Serif Display', serif; font-size: 16px; color: #6D638C; font-style: italic;">"Growth is not about being perfect.<br>It is about continuing."</p>
          </div>
          \`}

        </div>
      </div>

      <div class="footer">
        <div class="footer-text">Generated securely on your device.</div>
        <div class="footer-brand">Kaizen</div>
      </div>
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
