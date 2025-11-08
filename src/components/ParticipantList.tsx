import { useState, useEffect } from 'react';
import { RemoteParticipant, Participant as LiveKitParticipant } from 'livekit-client';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { Mic, MicOff, Crown, MoreVertical, UserCog } from 'lucide-react';
import { getDisplayName } from '../utils/user';

interface ParticipantWithProfile {
  sid: string;
  identity: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
  avatarUrl?: string | null;
}

interface ParticipantListProps {
  participants: RemoteParticipant[];
  localParticipant?: LiveKitParticipant | null;
  hostId?: string;
  currentUserId?: string;
  onMuteParticipant?: (participantId: string, participantName: string) => void;
  onMakeHost?: (participantId: string, participantName: string) => void;
}

export function ParticipantList({
  participants,
  localParticipant,
  hostId,
  currentUserId,
  onMuteParticipant,
  onMakeHost,
}: ParticipantListProps) {
  const [participantsWithProfiles, setParticipantsWithProfiles] = useState<ParticipantWithProfile[]>([]);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipantProfiles();
  }, [participants, localParticipant]);

  const fetchParticipantProfiles = async () => {
    try {
      const allParticipants: ParticipantWithProfile[] = [];

      // Add local participant
      if (localParticipant) {
        const [{ data: localProfile }, { data: userData }] = await Promise.all([
          supabase
            .from('profiles')
            .select('photo_url, display_name')
            .eq('id', localParticipant.identity)
            .single(),
          supabase.auth.getUser()
        ]);

        const displayName = getDisplayName(userData?.user || null, localProfile);

        allParticipants.push({
          sid: localParticipant.sid,
          identity: localParticipant.identity,
          name: displayName,
          isMuted: !localParticipant.isMicrophoneEnabled,
          isSpeaking: localParticipant.isSpeaking,
          isLocal: true,
          avatarUrl: localProfile?.photo_url || null,
        });
      }

      // Add remote participants
      for (const participant of participants) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('photo_url, display_name')
          .eq('id', participant.identity)
          .single();

        // For remote participants, we can't access their full user data
        // So we'll create a minimal user object with email from profile
        const displayName = profile?.display_name || participant.name || 'Anonymous';

        allParticipants.push({
          sid: participant.sid,
          identity: participant.identity,
          name: displayName,
          isMuted: !participant.isMicrophoneEnabled,
          isSpeaking: participant.isSpeaking,
          isLocal: false,
          avatarUrl: profile?.photo_url || null,
        });
      }

      setParticipantsWithProfiles(allParticipants);
    } catch (error) {
      console.error('Error fetching participant profiles:', error);
    }
  };

  const isHost = (participantId: string) => {
    return hostId === participantId;
  };

  const isCurrentUserHost = currentUserId === hostId;

  const handleMuteParticipant = (participant: ParticipantWithProfile) => {
    setOpenMenuFor(null);
    onMuteParticipant?.(participant.identity, participant.name);
  };

  const handleMakeHost = (participant: ParticipantWithProfile) => {
    setOpenMenuFor(null);
    onMakeHost?.(participant.identity, participant.name);
  };

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase">
        Participants ({participantsWithProfiles.length})
      </h3>
      <div className="space-y-2">
        {participantsWithProfiles.map((participant) => (
          <div
            key={participant.sid}
            className={`
              flex items-center gap-3 p-3 rounded-lg transition-all
              ${participant.isLocal ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-[#0f1419]'}
            `}
          >
            <Avatar
              avatarUrl={participant.avatarUrl}
              displayName={participant.name}
              userId={participant.identity}
              size="md"
              isSpeaking={participant.isSpeaking}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {participant.name}
                  {participant.isLocal && ' (You)'}
                </span>
                {isHost(participant.identity) && (
                  <Crown size={14} className="text-yellow-500" title="Host" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                {participant.isSpeaking && (
                  <span className="text-green-400">Speaking...</span>
                )}
                {!participant.isSpeaking && participant.isMuted && (
                  <span>Muted</span>
                )}
                {!participant.isSpeaking && !participant.isMuted && (
                  <span>Connected</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {participant.isMuted ? (
                <MicOff size={16} className="text-red-400" />
              ) : (
                <Mic size={16} className="text-green-400" />
              )}

              {/* Host Controls - Only show for host, not for themselves */}
              {isCurrentUserHost && !participant.isLocal && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuFor(openMenuFor === participant.identity ? null : participant.identity)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="More options"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuFor === participant.identity && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuFor(null)}
                      />

                      {/* Menu */}
                      <div className="absolute right-0 top-8 z-20 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl min-w-[160px] py-1">
                        {!participant.isMuted && (
                          <button
                            onClick={() => handleMuteParticipant(participant)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <MicOff size={14} className="text-red-400" />
                            <span>Mute</span>
                          </button>
                        )}

                        {!isHost(participant.identity) && (
                          <button
                            onClick={() => handleMakeHost(participant)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <UserCog size={14} className="text-yellow-500" />
                            <span>Make Host</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
