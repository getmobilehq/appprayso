import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLiveKit } from '../hooks/useLiveKit';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { ParticipantList } from '../components/ParticipantList';
import { AudioEqualizer } from '../components/AudioEqualizer';
import { ArrowLeft, Users, Radio, Lock, Send, Mic, MicOff } from 'lucide-react';

interface RoomDetails {
  id: string;
  name: string;
  description: string;
  host_id: string;
  host_name: string;
  participant_count: number;
  max_participants: number;
  status: 'scheduled' | 'live' | 'ended';
  category: string;
  is_private: boolean;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
  photo_url?: string | null;
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [mobileTab, setMobileTab] = useState<'participants' | 'chat'>('participants');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousMessageCountRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const liveKit = useLiveKit({
    roomName: id || '',
    participantName: user?.user_metadata?.full_name || user?.email || 'Anonymous',
    participantId: user?.id || '',
    onConnected: () => {
      console.log('Connected to LiveKit room');
    },
    onDisconnected: () => {
      console.log('Disconnected from LiveKit room');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchRoomDetails();
    fetchMessages();

    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe97OmlTQ4PWKzn77BdGAU7k9r0yoMrBSqBzvLZijUIGWe97OilTQ4PWKzn77BdGAU7k9r0yoMrBSqBzvLZijUIGWe97OilTQ4PWKzn77BdGAU7k9r0yoMrBSqBzvLZijUIGWe97OilTQ4PWKzn77BdGAU7k9r0yoMrBSqBzvLZijUIGWe97OilTQ4PWKzn77BdGAU7k9r0yoMrBSqBzvLZijUIGWe97OilTQ4PWKzn77BdGAU7k9r0yoMrBSqBzvLZijUIGWe97OilTQ4PWKzn77BdGAU7k9r0yoMrBQ==');

    const subscription = supabase
      .channel(`room_messages:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${id}`
      }, async (payload) => {
        const newMsg = payload.new as Message;

        // Fetch avatar for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('photo_url')
          .eq('id', newMsg.user_id)
          .single();

        const messageWithAvatar = {
          ...newMsg,
          photo_url: profile?.photo_url || null
        };

        setMessages(prev => [messageWithAvatar, ...prev]);

        // Play notification sound only for messages from other users
        if (previousMessageCountRef.current > 0 && audioRef.current && newMsg.user_id !== user?.id) {
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        previousMessageCountRef.current++;
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_rooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setRoom(data);
        if (data.status === 'live') {
          setIsLive(true);
        }
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          *,
          profiles:user_id (
            photo_url
          )
        `)
        .eq('room_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // Flatten the profile data into the message object
        const messagesWithAvatars = data.map(msg => ({
          ...msg,
          photo_url: msg.profiles?.photo_url || null
        }));
        setMessages(messagesWithAvatars);
        previousMessageCountRef.current = data.length;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!room || !user) return;

    try {
      await liveKit.connect();
      setHasJoined(true);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join the room. Please check your microphone permissions.');
    }
  };

  const handleGoLive = async () => {
    if (!room || !user) return;

    try {
      const { error } = await supabase
        .from('prayer_rooms')
        .update({ status: 'live' })
        .eq('id', id);

      if (error) throw error;

      await liveKit.connect();

      setIsLive(true);
      setHasJoined(true);
      if (room) {
        setRoom({ ...room, status: 'live' });
      }
    } catch (error) {
      console.error('Error going live:', error);
      alert('Failed to start the room. Please check your microphone permissions.');
    }
  };

  const handleEndLive = async () => {
    if (!room || !user) return;

    try {
      // Disconnect from LiveKit
      await liveKit.disconnect();

      // Update room status to ended
      const { error } = await supabase
        .from('prayer_rooms')
        .update({ status: 'ended' })
        .eq('id', id);

      if (error) throw error;

      setIsLive(false);
      setHasJoined(false);
      if (room) {
        setRoom({ ...room, status: 'ended' });
      }
    } catch (error) {
      console.error('Error ending live session:', error);
      alert('Failed to end live session.');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await liveKit.disconnect();
      setHasJoined(false);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('room_messages')
        .insert({
          room_id: id,
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Anonymous',
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Room not found</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <nav className="bg-[#1a1f2e] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={20} />}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              {room.status === 'live' && (
                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                  <Radio size={12} />
                  LIVE
                </span>
              )}
              {room.is_private && (
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full flex items-center gap-1">
                  <Lock size={12} />
                  Private
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* New X Spaces-style layout for live sessions */}
        {isLive && hasJoined ? (
          <div className="flex gap-6 h-[calc(100vh-140px)]">
            {/* Main Content Area (70%) - Desktop only */}
            <div className={`flex-1 space-y-4 ${mobileTab === 'chat' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
              {/* Room Header */}
              <div className="bg-[#1a1f2e] rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-2">{room.name}</h1>
                <p className="text-gray-400 text-sm mb-4">{room.description}</p>

                {/* Status Badge */}
                {user && room.host_id === user.id ? (
                  <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                      <span className="font-bold text-lg text-red-400">YOU ARE LIVE</span>
                    </div>
                    <div className="flex justify-center mb-3">
                      <AudioEqualizer isActive={liveKit.isConnected} isMuted={liveKit.isMuted} barCount={7} audioTrack={liveKit.audioTrack} />
                    </div>
                    <p className="text-center text-gray-300 text-sm">
                      {liveKit.isMuted ? 'Your mic is muted' : `Broadcasting to ${liveKit.participants.length} participant(s)`}
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span className="font-bold text-green-400">CONNECTED</span>
                    </div>
                    <div className="flex justify-center mb-3">
                      <AudioEqualizer isActive={liveKit.isConnected} isMuted={liveKit.isMuted} barCount={7} audioTrack={liveKit.audioTrack} />
                    </div>
                    <p className="text-center text-gray-300 text-sm">
                      {liveKit.isMuted ? 'Your mic is muted' : 'You are connected'}
                    </p>
                  </div>
                )}

                {/* Audio Controls */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    onClick={liveKit.toggleMute}
                    variant={liveKit.isMuted ? 'danger' : 'primary'}
                    size="lg"
                    icon={liveKit.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  >
                    {liveKit.isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    onClick={user && room.host_id === user.id ? handleEndLive : handleLeaveRoom}
                    variant={user && room.host_id === user.id ? 'danger' : 'secondary'}
                    size="lg"
                  >
                    {user && room.host_id === user.id ? 'End Live' : 'Leave'}
                  </Button>
                </div>
              </div>

              {/* Participant List */}
              <div className="flex-1 overflow-hidden">
                <ParticipantList
                  participants={liveKit.participants}
                  localParticipant={liveKit.room?.localParticipant}
                  hostId={room.host_id}
                  currentUserId={user?.id}
                />
              </div>
            </div>

            {/* Chat Sidebar (30%) - Desktop, or full width on mobile when tab is active */}
            <div className={`w-full lg:w-96 flex flex-col bg-[#1a1f2e] rounded-2xl overflow-hidden ${mobileTab === 'participants' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  {showChat ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 items-start">
                    <Avatar
                      avatarUrl={msg.photo_url}
                      displayName={msg.user_name}
                      userId={msg.user_id}
                      size="sm"
                    />
                    <div className="flex-1 bg-[#0f1419] rounded-lg p-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.user_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<Send size={18} />}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-gray-800 lg:hidden z-50">
              <div className="flex">
                <button
                  onClick={() => setMobileTab('participants')}
                  className={`flex-1 py-4 text-sm font-medium ${mobileTab === 'participants' ? 'text-blue-400 border-t-2 border-blue-400' : 'text-gray-400'}`}
                >
                  Participants
                </button>
                <button
                  onClick={() => setMobileTab('chat')}
                  className={`flex-1 py-4 text-sm font-medium ${mobileTab === 'chat' ? 'text-blue-400 border-t-2 border-blue-400' : 'text-gray-400'}`}
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Original layout for non-live rooms */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            <div className="bg-[#1a1f2e] rounded-2xl p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
              <p className="text-gray-400 mb-4">{room.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{room.participant_count} / {room.max_participants}</span>
                </div>
                <span>•</span>
                <span>Hosted by {room.host_name}</span>
                <span>•</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{room.category}</span>
              </div>

              {user && room.host_id === user.id && !isLive ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">Ready to Start?</h3>
                    <p className="text-gray-400 mb-4">
                      Click the button below to go live and start your prayer session.
                      Participants will be able to join once you're live.
                    </p>
                  </div>
                  <Button
                    onClick={handleGoLive}
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={<Radio size={24} />}
                  >
                    Go Live
                  </Button>
                </div>
              ) : (!user || room.host_id !== user.id) && !isLive ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                  <p className="text-gray-400">This room is not live yet. The host needs to start the session.</p>
                </div>
              ) : (!user || room.host_id !== user.id) && isLive && !hasJoined ? (
                <Button
                  onClick={handleJoinRoom}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={room.participant_count >= room.max_participants}
                >
                  {room.participant_count >= room.max_participants ? 'Room Full' : 'Join Room'}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#1a1f2e] rounded-2xl p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Room Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium capitalize">{room.status}</span>
                </div>
                {room.scheduled_start_time && (
                  <div>
                    <span className="text-gray-500">Starts:</span>
                    <span className="ml-2 font-medium">
                      {new Date(room.scheduled_start_time).toLocaleString()}
                    </span>
                  </div>
                )}
                {room.scheduled_end_time && (
                  <div>
                    <span className="text-gray-500">Ends:</span>
                    <span className="ml-2 font-medium">
                      {new Date(room.scheduled_end_time).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(room.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
