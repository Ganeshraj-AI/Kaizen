// ==============================================================
// KAIZEN - ACTIVITY LANGUAGE SYSTEM
// Generates soft, warm, and emotionally safe copy for the social layer.
// ==============================================================

export function getActivityMessage(type, data) {
  if (type === 'habit_rhythm') {
    const { rhythm } = data
    
    // rhythm is out of the last 7 days
    if (rhythm === 7) return "A perfect rhythm this week."
    if (rhythm >= 5) return "Showing up consistently."
    if (rhythm >= 3) return "Steady and forming."
    if (rhythm >= 1) return "Returned recently."
    return "Quietly resting."
  }
  
  if (type === 'streak_milestone') {
    const { streak } = data
    if (streak > 30) return "Deeply rooted."
    if (streak > 14) return "Building a foundation."
    if (streak > 7) return "Gaining momentum."
    return "Taking small steps."
  }

  return "Growing quietly."
}
