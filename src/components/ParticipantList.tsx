import { useState, useEffect } from 'react';
import { RemoteParticipant, Participant as LiveKitParticipant } from 'livekit-client';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { Mic, MicOff, Crown } from 'lucide-react';

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
}

export function ParticipantList({
  participants,
  localParticipant,
  hostId,
  currentUserId,
}: ParticipantListProps) {
  const [participantsWithProfiles, setParticipantsWithProfiles] = useState<ParticipantWithProfile[]>([]);

  useEffect(() => {
    fetchParticipantProfiles();
  }, [participants, localParticipant]);

  const fetchParticipantProfiles = async () => {
    try {
      const allParticipants: ParticipantWithProfile[] = [];

      // Add local participant
      if (localParticipant) {
        const { data: localProfile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', localParticipant.identity)
          .single();

        allParticipants.push({
          sid: localParticipant.sid,
          identity: localParticipant.identity,
          name: localParticipant.name || 'You',
          isMuted: !localParticipant.isMicrophoneEnabled,
          isSpeaking: localParticipant.isSpeaking,
          isLocal: true,
          avatarUrl: localProfile?.avatar_url || null,
        });
      }

      // Add remote participants
      for (const participant of participants) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', participant.identity)
          .single();

        allParticipants.push({
          sid: participant.sid,
          identity: participant.identity,
          name: participant.name || 'Anonymous',
          isMuted: !participant.isMicrophoneEnabled,
          isSpeaking: participant.isSpeaking,
          isLocal: false,
          avatarUrl: profile?.avatar_url || null,
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
            <div>
              {participant.isMuted ? (
                <MicOff size={16} className="text-red-400" />
              ) : (
                <Mic size={16} className="text-green-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
