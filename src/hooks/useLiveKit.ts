import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';

interface UseLiveKitOptions {
  roomName: string;
  participantName: string;
  participantId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useLiveKit({ roomName, participantName, participantId, onConnected, onDisconnected }: UseLiveKitOptions) {
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
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.play();
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

  return {
    connect,
    disconnect,
    toggleMute,
    isConnected,
    isMuted,
    participants,
    audioTrack,
    room: roomRef.current,
  };
}
