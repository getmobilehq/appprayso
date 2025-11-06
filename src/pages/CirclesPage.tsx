import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Circle, CircleMember } from '../types';
import { NotificationBell } from '../components/NotificationBell';
import { ArrowLeft, Plus, Users, Crown, Trash2, UserPlus, UserMinus, Globe, Lock, Settings, Check, X, Clock } from 'lucide-react';

export function CirclesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [newCircleIsPublic, setNewCircleIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userCircleMemberships, setUserCircleMemberships] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCircles();
      fetchUserMemberships();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchCircles = async () => {
    try {
      const { data, error } = await supabase
        .from('circles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCircles(
        data.map((circle) => ({
          id: circle.id,
          name: circle.name,
          description: circle.description,
          ownerId: circle.owner_id,
          ownerName: circle.owner_name,
          memberCount: circle.member_count,
          isPublic: circle.is_public,
          createdAt: new Date(circle.created_at),
          updatedAt: new Date(circle.updated_at),
        }))
      );
      setLoading(false);
    } catch (error) {
      console.error('Error fetching circles:', error);
      setLoading(false);
    }
  };

  const fetchUserMemberships = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const membershipSet = new Set(data.map(m => m.circle_id));
      setUserCircleMemberships(membershipSet);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('circle_join_requests')
        .select('circle_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const pendingSet = new Set(data.map(r => r.circle_id));
      setPendingRequests(pendingSet);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const fetchJoinRequests = async (circleId: string) => {
    try {
      const { data, error } = await supabase
        .from('circle_join_requests')
        .select('*')
        .eq('circle_id', circleId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  };

  const fetchCircleMembers = async (circleId: string) => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', circleId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      setCircleMembers(
        data.map((member) => ({
          id: member.id,
          circleId: member.circle_id,
          userId: member.user_id,
          userName: member.user_name,
          role: member.role,
          joinedAt: new Date(member.joined_at),
        }))
      );
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCircleName.trim()) return;

    setCreating(true);

    try {
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .insert({
          name: newCircleName.trim(),
          description: newCircleDescription.trim(),
          owner_id: user.id,
          owner_name: user.email?.split('@')[0] || user.email || 'Anonymous',
          is_public: newCircleIsPublic,
        })
        .select()
        .single();

      if (circleError) throw circleError;

      await supabase.from('circle_members').insert({
        circle_id: circle.id,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || user.email || 'Anonymous',
        role: 'owner',
      });

      setNewCircleName('');
      setNewCircleDescription('');
      setNewCircleIsPublic(true);
      setShowCreateModal(false);
      fetchCircles();
    } catch (error) {
      console.error('Error creating circle:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircle || !inviteEmail.trim()) return;

    setInviting(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('email', inviteEmail.trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        alert('User not found with that email address.');
        setInviting(false);
        return;
      }

      const { error: memberError } = await supabase.from('circle_members').insert({
        circle_id: selectedCircle.id,
        user_id: profile.id,
        user_name: profile.display_name || profile.email,
        role: 'member',
      });

      if (memberError) {
        if (memberError.code === '23505') {
          alert('This user is already a member of this circle.');
        } else {
          throw memberError;
        }
      } else {
        setInviteEmail('');
        fetchCircleMembers(selectedCircle.id);
        fetchCircles();
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedCircle) return;
    if (!window.confirm(`Remove ${memberName} from this circle?`)) return;

    try {
      const { error } = await supabase.from('circle_members').delete().eq('id', memberId);

      if (error) throw error;

      fetchCircleMembers(selectedCircle.id);
      fetchCircles();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleLeaveCircle = async (circle: Circle) => {
    if (!user) return;
    if (!window.confirm(`Leave ${circle.name}?`)) return;

    try {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circle.id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchCircles();
    } catch (error) {
      console.error('Error leaving circle:', error);
    }
  };

  const handleDeleteCircle = async (circle: Circle) => {
    if (!window.confirm(`Delete ${circle.name}? This will remove all members.`)) return;

    try {
      const { error } = await supabase.from('circles').delete().eq('id', circle.id);

      if (error) throw error;

      setSelectedCircle(null);
      fetchCircles();
    } catch (error) {
      console.error('Error deleting circle:', error);
    }
  };

  const handleUpdateCirclePrivacy = async () => {
    if (!editingCircle) return;

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('circles')
        .update({ is_public: editIsPublic })
        .eq('id', editingCircle.id);

      if (error) throw error;

      setShowSettingsModal(false);
      setEditingCircle(null);
      fetchCircles();
    } catch (error) {
      console.error('Error updating circle:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenSettings = (circle: Circle) => {
    setEditingCircle(circle);
    setEditIsPublic(circle.isPublic);
    setShowSettingsModal(true);
  };

  const handleJoinCircle = async (circle: Circle) => {
    if (!user) return;
    setJoining(circle.id);

    try {
      const { error } = await supabase
        .from('circle_join_requests')
        .insert({
          circle_id: circle.id,
          user_id: user.id,
          user_name: user.email?.split('@')[0] || user.email || 'Anonymous',
        });

      if (error) {
        if (error.code === '23505') {
          alert('You already have a pending request for this circle.');
        } else {
          throw error;
        }
      } else {
        if (circle.isPublic) {
          alert('You have joined the circle!');
          fetchUserMemberships();
          fetchCircles();
        } else {
          alert('Join request sent! The owner will review your request.');
          fetchPendingRequests();
        }
      }
    } catch (error) {
      console.error('Error joining circle:', error);
      alert('Failed to join circle. Please try again.');
    } finally {
      setJoining(null);
    }
  };

  const handleApproveRequest = async (requestId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('circle_join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      alert(`${userName} has been added to the circle!`);
      fetchJoinRequests(selectedCircle!.id);
      fetchCircleMembers(selectedCircle!.id);
      fetchCircles();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request.');
    }
  };

  const handleRejectRequest = async (requestId: string, userName: string) => {
    if (!window.confirm(`Reject join request from ${userName}?`)) return;

    try {
      const { error } = await supabase
        .from('circle_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      alert('Request rejected.');
      fetchJoinRequests(selectedCircle!.id);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request.');
    }
  };

  const isOwner = (circle: Circle) => user?.id === circle.ownerId;
  const isMember = (circle: Circle) => userCircleMemberships.has(circle.id);
  const hasPendingRequest = (circle: Circle) => pendingRequests.has(circle.id);

  const getJoinButtonText = (circle: Circle) => {
    if (isMember(circle)) return 'Leave Circle';
    if (hasPendingRequest(circle)) return 'Request Pending';
    return 'Join Circle';
  };

  return (
    <div className="min-h-screen bg-[#15202b]">
      <nav className="bg-[#1e2732] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">My Circles</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Create private prayer groups</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transform hover:scale-105 transition-colors font-medium shadow-lg text-sm sm:text-base flex-shrink-0"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                <span>New Circle</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-400">Loading circles...</p>
          </div>
        ) : circles.length === 0 ? (
          <div className="text-center py-16">
            <Users size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-4">You don't have any circles yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transform hover:scale-105 transition-colors font-medium"
            >
              Create Your First Circle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map((circle) => (
              <div
                key={circle.id}
                onClick={() => {
                  setSelectedCircle(circle);
                  fetchCircleMembers(circle.id);
                  if (isOwner(circle)) {
                    fetchJoinRequests(circle.id);
                  }
                }}
                className="bg-[#1e2732] rounded-2xl p-6 hover:bg-[#24303f] transition-all cursor-pointer border border-gray-800 hover:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{circle.name}</h3>
                    <div className="flex items-center gap-2">
                      {isOwner(circle) && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
                          <Crown size={12} />
                          Owner
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                        circle.isPublic
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {circle.isPublic ? (
                          <>
                            <Globe size={12} />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock size={12} />
                            Private
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  {isOwner(circle) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSettings(circle);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#15202b] rounded-lg transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{circle.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={16} />
                      <span>{circle.memberCount} members</span>
                    </div>
                    <span className="text-xs text-gray-500">by {circle.ownerName}</span>
                  </div>
                  {!isOwner(circle) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMember(circle)) {
                          handleLeaveCircle(circle);
                        } else if (!hasPendingRequest(circle)) {
                          handleJoinCircle(circle);
                        }
                      }}
                      disabled={joining === circle.id || hasPendingRequest(circle)}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                        isMember(circle)
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : hasPendingRequest(circle)
                          ? 'bg-yellow-500/10 text-yellow-400 cursor-not-allowed flex items-center justify-center gap-2'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {joining === circle.id ? (
                        'Joining...'
                      ) : hasPendingRequest(circle) ? (
                        <>
                          <Clock size={16} />
                          Request Pending
                        </>
                      ) : (
                        getJoinButtonText(circle)
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e2732] rounded-2xl max-w-md w-full p-6 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Circle</h2>
            <form onSubmit={handleCreateCircle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Circle Name</label>
                <input
                  type="text"
                  required
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#15202b] border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Family Prayer Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newCircleDescription}
                  onChange={(e) => setNewCircleDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#15202b] border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What is this circle for?"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Privacy</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCircleIsPublic(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      newCircleIsPublic
                        ? 'bg-green-500/10 border-green-500 text-green-400'
                        : 'bg-[#15202b] border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Globe size={20} className="mx-auto mb-1" />
                    <span className="block font-medium">Public</span>
                    <span className="block text-xs opacity-75">Anyone can join</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCircleIsPublic(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      !newCircleIsPublic
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                        : 'bg-[#15202b] border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Lock size={20} className="mx-auto mb-1" />
                    <span className="block font-medium">Private</span>
                    <span className="block text-xs opacity-75">Invite only</span>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Circle'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#15202b] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCircle && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCircle(null)}
        >
          <div
            className="bg-[#1e2732] rounded-2xl max-w-2xl w-full p-6 border border-gray-800 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedCircle.name}</h2>
                <p className="text-gray-400 text-sm">{selectedCircle.description}</p>
              </div>
              {isOwner(selectedCircle) && (
                <button
                  onClick={() => handleDeleteCircle(selectedCircle)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {isOwner(selectedCircle) && joinRequests.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  Pending Join Requests ({joinRequests.length})
                </h3>
                <div className="space-y-2">
                  {joinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-[#1e2732] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                          {request.user_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{request.user_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id, request.user_name)}
                          className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id, request.user_name)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOwner(selectedCircle) && (
              <form onSubmit={handleInviteMember} className="mb-6 p-4 bg-[#15202b] rounded-lg border border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <UserPlus size={16} className="inline mr-1" />
                  Invite Member by Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#1e2732] border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </form>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Members ({circleMembers.length})
              </h3>
              <div className="space-y-2">
                {circleMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-[#15202b] rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.userName}</p>
                        {member.role === 'owner' && (
                          <p className="text-xs text-yellow-500 flex items-center gap-1">
                            <Crown size={12} />
                            Owner
                          </p>
                        )}
                      </div>
                    </div>
                    {isOwner(selectedCircle) && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.userName)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
              {!isOwner(selectedCircle) && (
                <button
                  onClick={() => handleLeaveCircle(selectedCircle)}
                  className="px-6 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                >
                  Leave Circle
                </button>
              )}
              <button
                onClick={() => setSelectedCircle(null)}
                className="ml-auto px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#15202b] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && editingCircle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e2732] rounded-2xl max-w-md w-full p-6 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2">Circle Settings</h2>
            <p className="text-gray-400 text-sm mb-6">{editingCircle.name}</p>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Privacy</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditIsPublic(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      editIsPublic
                        ? 'bg-green-500/10 border-green-500 text-green-400'
                        : 'bg-[#15202b] border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Globe size={20} className="mx-auto mb-1" />
                    <span className="block font-medium">Public</span>
                    <span className="block text-xs opacity-75">Anyone can join</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsPublic(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      !editIsPublic
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                        : 'bg-[#15202b] border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Lock size={20} className="mx-auto mb-1" />
                    <span className="block font-medium">Private</span>
                    <span className="block text-xs opacity-75">Invite only</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateCirclePrivacy}
                  disabled={updating}
                  className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setEditingCircle(null);
                  }}
                  disabled={updating}
                  className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#15202b] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
