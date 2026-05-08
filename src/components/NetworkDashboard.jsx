import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Check, X, UserMinus, User, Clock, Shield } from 'lucide-react'
import { useSocial } from '../hooks/useSocial'

export default function NetworkDashboard() {
  const {
    friends,
    pendingRequests,
    sentRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    loading
  } = useSocial()

  const [activeTab, setActiveTab] = useState('friends') // 'friends', 'requests', 'add'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchUsers(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  const handleSendRequest = async (userId) => {
    await sendFriendRequest(userId)
    setSearchQuery('')
    setSearchResults([])
    setActiveTab('requests')
  }

  const renderProfileRow = (profile, actionButton) => (
    <div key={profile.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', borderRadius: 12, marginBottom: 8, border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-lavender-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-purple-dark)', fontWeight: 600 }}>
          {profile.display_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{profile.display_name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>@{profile.username}</span>
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--color-lavender)', borderRadius: 4, color: 'var(--color-purple)' }}>{profile.kaizen_id}</span>
          </div>
        </div>
      </div>
      <div>{actionButton}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, padding: 4, background: 'var(--color-lavender)', borderRadius: 12 }}>
        {['friends', 'requests', 'add'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', textTransform: 'capitalize',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? 'var(--color-purple)' : 'var(--color-text-muted)',
              transition: 'all 0.2s ease', boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
            }}
          >
            {tab === 'requests' && pendingRequests.length > 0 && (
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#EF4444', marginRight: 6, transform: 'translateY(-1px)' }} />
            )}
            {tab}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>}

      {!loading && activeTab === 'friends' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} color="var(--color-purple)" /></div>
              <p>Your inner circle is empty.<br/>Growth is personal, but doing it alongside trusted friends makes it lasting.</p>
              <button className="btn-primary" onClick={() => setActiveTab('add')} style={{ marginTop: 8 }}>Find Friends</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Your Circle ({friends.length})</p>
              {friends.map(f => renderProfileRow(f, (
                <button onClick={() => removeFriend(f.id)} className="btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} title="Remove friend">
                  <UserMinus size={15} />
                </button>
              )))}
            </div>
          )}
        </motion.div>
      )}

      {!loading && activeTab === 'requests' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pending Requests</p>
            {pendingRequests.length === 0 ? (
              <div style={{ padding: 20, background: 'rgba(255,255,255,0.5)', borderRadius: 12, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>No pending requests.</div>
            ) : (
              pendingRequests.map(req => renderProfileRow(req.sender, (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => acceptFriendRequest(req.id)} style={{ background: 'var(--color-lavender-mid)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-purple-dark)' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => rejectFriendRequest(req.id)} style={{ background: '#FEE2E2', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                    <X size={16} />
                  </button>
                </div>
              )))
            )}
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Sent Requests</p>
            {sentRequests.length === 0 ? (
              <div style={{ padding: 20, background: 'rgba(255,255,255,0.5)', borderRadius: 12, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>No sent requests.</div>
            ) : (
              sentRequests.map(req => renderProfileRow(req.receiver, (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Pending
                </div>
              )))
            )}
          </div>
        </motion.div>
      )}

      {!loading && activeTab === 'add' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Search by Kaizen ID or username..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 40, width: '100%', fontSize: 14, padding: '14px 14px 14px 40px' }}
            />
          </div>

          {isSearching ? (
            <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>
          ) : searchResults.length > 0 ? (
            <div>
              {searchResults.map(user => renderProfileRow(user, (
                <button 
                  onClick={() => handleSendRequest(user.id)} 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  disabled={sentRequests.some(r => r.receiver_id === user.id) || friends.some(f => f.id === user.id)}
                >
                  <UserPlus size={14} /> 
                  {sentRequests.some(r => r.receiver_id === user.id) ? 'Sent' : friends.some(f => f.id === user.id) ? 'Added' : 'Add'}
                </button>
              )))}
            </div>
          ) : searchQuery.length >= 3 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontSize: 13 }}>
              No users found matching "{searchQuery}"
            </div>
          ) : (
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.5)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Shield size={20} color="var(--color-purple)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Privacy is built-in. You can only find users by their exact Kaizen ID (e.g. KZN-A91X) or username. Users with Private Growth Mode enabled will not appear in search results.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
