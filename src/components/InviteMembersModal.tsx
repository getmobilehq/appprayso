import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Send, Loader2, UserPlus } from 'lucide-react';
import { Avatar } from './Avatar';

interface CircleMember {
  user_id: string;
  profile: {
    display_name: string | null;
    photo_url: string | null;
  };
}

interface InviteMembersModalProps {
  roomId: string;
  roomName: string;
  circleId: string;
  onClose: () => void;
  onInvitesSent: (count: number) => void;
}

export function InviteMembersModal({
  roomId,
  roomName,
  circleId,
  onClose,
  onInvitesSent,
}: InviteMembersModalProps) {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alreadyInvited, setAlreadyInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCircleMembers();
  }, [circleId, roomId]);

  const fetchCircleMembers = async () => {
    try {
      setLoading(true);

      // Fetch circle members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select(`
          user_id,
          profiles:user_id (
            display_name,
            photo_url
          )
        `)
        .eq('circle_id', circleId);

      if (membersError) throw membersError;

      // Fetch existing invitations for this room
      const { data: invitesData, error: invitesError } = await supabase
        .from('room_invites')
        .select('invitee_id')
        .eq('room_id', roomId)
        .eq('status', 'pending');

      if (invitesError) throw invitesError;

      const invitedUserIds = new Set(
        invitesData?.map((invite) => invite.invitee_id).filter(Boolean) || []
      );

      setAlreadyInvited(invitedUserIds);
      setMembers(membersData as unknown as CircleMember[]);
    } catch (error) {
      console.error('Error fetching circle members:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSendInvites = async () => {
    if (selectedMembers.size === 0) return;

    try {
      setSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create invitations for selected members
      const invitations = Array.from(selectedMembers).map((userId) => ({
        room_id: roomId,
        inviter_id: user.id,
        invitee_id: userId,
        status: 'pending',
      }));

      const { error: inviteError } = await supabase
        .from('room_invites')
        .insert(invitations);

      if (inviteError) throw inviteError;

      // Create notifications for invited members
      const notifications = Array.from(selectedMembers).map((userId) => ({
        user_id: userId,
        type: 'room_invite',
        title: 'Room Invitation',
        message: `You've been invited to join "${roomName}"`,
        action_url: `/room/${roomId}`,
        action_label: 'View Room',
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) console.error('Error creating notifications:', notifError);

      onInvitesSent(selectedMembers.size);
      onClose();
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getDisplayName = (member: CircleMember): string => {
    return member.profile?.display_name || 'Anonymous';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus size={24} className="text-blue-400" />
              Invite Members
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            Select circle members to invite to this room
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin mx-auto text-blue-400 mb-2" />
              <p className="text-gray-400 text-sm">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No circle members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isInvited = alreadyInvited.has(member.user_id);
                const isSelected = selectedMembers.has(member.user_id);
                const displayName = getDisplayName(member);

                return (
                  <div
                    key={member.user_id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer
                      ${isInvited ? 'bg-gray-700/50 opacity-50 cursor-not-allowed' :
                        isSelected ? 'bg-blue-500/20 border border-blue-500/50' :
                        'bg-[#0f1419] hover:bg-gray-700/50'}
                    `}
                    onClick={() => !isInvited && toggleMember(member.user_id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isInvited}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
                    />
                    <Avatar
                      avatarUrl={member.profile?.photo_url}
                      displayName={displayName}
                      userId={member.user_id}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-white">
                        {displayName}
                      </p>
                      {isInvited && (
                        <p className="text-xs text-gray-500">Already invited</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvites}
                disabled={selectedMembers.size === 0 || sending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Invites
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
