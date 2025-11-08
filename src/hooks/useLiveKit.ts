import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';

interface ModerationCommand {
  type: 'MUTE_REQUEST' | 'HOST_TRANSFER' | 'UNMUTE_REQUEST';
  targetId?: string;
  newHostId?: string;
  moderatorName?: string;
}

interface UseLiveKitOptions {
  roomName: string;
  participantName: string;
  participantId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMuteRequest?: (moderatorName: string) => void;
  onHostTransfer?: (newHostId: string) => void;
  onParticipantDisconnected?: (participantId: string) => void;
}

export function useLiveKit({
  roomName,
  participantName,
  participantId,
  onConnected,
  onDisconnected,
  onMuteRequest,
  onHostTransfer,
  onParticipantDisconnected
}: UseLiveKitOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: {
          roomName,
          participantName,
          participantId,
        },
      });

      if (error) throw error;
      if (!data?.token) throw new Error('No token received');

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        onConnected?.();
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        onDisconnected?.();
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setParticipants(prev => [...prev, participant]);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
        // Notify callback with participant ID for auto host assignment
        onParticipantDisconnected?.(participant.identity);
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.play();
        }
      });

      // Handle data messages for moderation commands
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        const decoder = new TextDecoder();
        const message = decoder.decode(payload);

        try {
          const command: ModerationCommand = JSON.parse(message);

          // Only process commands targeted at this participant
          if (command.targetId && command.targetId !== participantId) {
            return;
          }

          switch (command.type) {
            case 'MUTE_REQUEST':
              // Automatically mute when requested by host
              room.localParticipant.setMicrophoneEnabled(false);
              setIsMuted(true);
              onMuteRequest?.(command.moderatorName || 'Host');
              break;

            case 'HOST_TRANSFER':
              onHostTransfer?.(command.newHostId || '');
              break;

            default:
              console.warn('Unknown moderation command:', command.type);
          }
        } catch (error) {
          console.error('Error parsing moderation command:', error);
        }
      });

      await room.connect(env.VITE_LIVEKIT_URL, data.token);

      await room.localParticipant.setMicrophoneEnabled(true);

      const localAudioTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      if (localAudioTrack) {
        setAudioTrack(localAudioTrack.mediaStreamTrack);
      }

      setParticipants(Array.from(room.remoteParticipants.values()));
    } catch (error) {
      console.error('Error connecting to LiveKit:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
      setIsConnected(false);
      setParticipants([]);
      setAudioTrack(null);
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current) return;

    const newMutedState = !isMuted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
    setIsMuted(newMutedState);
  };

  const sendMuteCommand = async (targetUserId: string, moderatorName: string) => {
    if (!roomRef.current) return;

    const command: ModerationCommand = {
      type: 'MUTE_REQUEST',
      targetId: targetUserId,
      moderatorName,
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(command));

    await roomRef.current.localParticipant.publishData(data, {
      reliable: true,
      destinationIdentities: [targetUserId], // Send only to target user
    });
  };

  const sendHostTransferNotification = async (newHostId: string) => {
    if (!roomRef.current) return;

    const command: ModerationCommand = {
      type: 'HOST_TRANSFER',
      newHostId,
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(command));

    // Broadcast to all participants
    await roomRef.current.localParticipant.publishData(data, {
      reliable: true,
    });
  };

  return {
    connect,
    disconnect,
    toggleMute,
    sendMuteCommand,
    sendHostTransferNotification,
    isConnected,
    isMuted,
    participants,
    audioTrack,
    room: roomRef.current,
  };
}
