import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from './useStore'

export function useSocial() {
  const { user, profile } = useStore()
  
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([]) // Requests received
  const [sentRequests, setSentRequests] = useState([])       // Requests sent
  const [loading, setLoading] = useState(true)

  const loadNetwork = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // 1. Fetch Friendships
    const { data: fData } = await supabase
      .from('friendships')
      .select(`
        user_id_1, user_id_2,
        profile1:profiles!friendships_user_id_1_fkey(id, kaizen_id, username, display_name, avatar_url),
        profile2:profiles!friendships_user_id_2_fkey(id, kaizen_id, username, display_name, avatar_url)
      `)
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

    const formattedFriends = (fData || []).map(f => {
      // Return whichever profile is NOT the current user
      return f.user_id_1 === user.id ? f.profile2 : f.profile1
    })
    setFriends(formattedFriends)

    // 2. Fetch Requests
    const { data: rData } = await supabase
      .from('friend_requests')
      .select(`
        id, status, sender_id, receiver_id, created_at,
        sender:profiles!friend_requests_sender_id_fkey(id, kaizen_id, username, display_name),
        receiver:profiles!friend_requests_receiver_id_fkey(id, kaizen_id, username, display_name)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'pending')

    const sent = []
    const received = []
    ;(rData || []).forEach(r => {
      if (r.sender_id === user.id) sent.push(r)
      else received.push(r)
    })
    
    setSentRequests(sent)
    setPendingRequests(received)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadNetwork()
  }, [loadNetwork])

  // Search users by kaizen_id or username
  const searchUsers = async (query) => {
    if (!query || query.length < 3) return []
    const q = query.toLowerCase()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, kaizen_id, username, display_name')
      .eq('private_growth_mode', false)
      .neq('id', user.id)
      .or(`kaizen_id.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(10)
      
    if (error) console.error(error)
    return data || []
  }

  const sendFriendRequest = async (receiverId) => {
    const { error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }])
    
    if (!error) loadNetwork()
    return { error }
  }

  const acceptFriendRequest = async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('receiver_id', user.id) // Security check

    if (!error) loadNetwork()
    return { error }
  }

  const rejectFriendRequest = async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('receiver_id', user.id)

    if (!error) loadNetwork()
    return { error }
  }

  const removeFriend = async (friendId) => {
    // Delete friendship
    const { error: fError } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${user.id})`)

    // Delete associated requests to allow future re-adds
    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)

    if (!fError) loadNetwork()
    return { error: fError }
  }

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshNetwork: loadNetwork
  }
}
