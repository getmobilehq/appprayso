import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PrayerRoom } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Radio, Lock, Users, Clock, Calendar, CheckCircle } from 'lucide-react';

export function MyRoomsPage() {
  const [liveRooms, setLiveRooms] = useState<PrayerRoom[]>([]);
  const [scheduledRooms, setScheduledRooms] = useState<PrayerRoom[]>([]);
  const [pastRooms, setPastRooms] = useState<PrayerRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyRooms = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get all rooms the user has joined via room_speakers table
        const { data: joinedRoomIds, error: speakersError } = await supabase
          .from('room_speakers')
          .select('room_id')
          .eq('user_id', user.id);

        if (speakersError) {
          console.error('Error fetching joined rooms:', speakersError);
          return;
        }

        if (!joinedRoomIds || joinedRoomIds.length === 0) {
          setLoading(false);
          return;
        }

        const roomIds = joinedRoomIds.map(r => r.room_id);

        // Fetch room details for all joined rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('prayer_rooms')
          .select('*')
          .in('id', roomIds)
          .order('created_at', { ascending: false });

        if (roomsError) {
          console.error('Error fetching room details:', roomsError);
          return;
        }

        const rooms = roomsData.map((room) => ({
          id: room.id,
          name: room.name,
          description: room.description,
          category: room.category,
          hostId: room.host_id,
          hostName: room.host_name,
          participantCount: room.participant_count,
          isActive: room.is_active,
          createdAt: new Date(room.created_at),
          circleId: room.circle_id,
          isPrivate: room.is_private,
          status: room.status,
          scheduledStartTime: room.scheduled_start_time ? new Date(room.scheduled_start_time) : undefined,
          maxParticipants: room.max_participants,
        })) as PrayerRoom[];

        // Group rooms by status
        const live = rooms.filter(r => r.status === 'live');
        const scheduled = rooms.filter(r => r.status === 'scheduled');
        const past = rooms.filter(r => r.status === 'ended');

        setLiveRooms(live);
        setScheduledRooms(scheduled);
        setPastRooms(past);
      } catch (error) {
        console.error('Error fetching my rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRooms();

    // Subscribe to changes in room_speakers table
    const speakersChannel = supabase
      .channel('my_room_speakers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_speakers',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchMyRooms();
        }
      )
      .subscribe();

    // Subscribe to changes in prayer_rooms table
    const roomsChannel = supabase
      .channel('my_prayer_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_rooms',
        },
        () => {
          fetchMyRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(speakersChannel);
      supabase.removeChannel(roomsChannel);
    };
  }, [user]);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const formatScheduledTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'Starting soon';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15202b] text-white">
        <nav className="bg-[#1e2732] border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={20} />}
            >
              Back
            </Button>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your rooms...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15202b] text-white">
      <nav className="bg-[#1e2732] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={20} />}
          >
            Back
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Rooms</h1>
          <p className="text-gray-400 text-xs sm:text-sm">All prayer rooms you've joined</p>
        </div>

        {liveRooms.length === 0 && scheduledRooms.length === 0 && pastRooms.length === 0 ? (
          <div className="text-center py-16 bg-[#1e2732] rounded-2xl">
            <Radio size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-2">You haven't joined any rooms yet</p>
            <p className="text-gray-500 text-sm mb-4">Join a room to see it here</p>
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              size="lg"
            >
              Browse Rooms
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Rooms */}
            {liveRooms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <h2 className="text-xl font-bold">Live Now</h2>
                  <span className="text-gray-500 text-sm">({liveRooms.length})</span>
                </div>
                <div className="space-y-4">
                  {liveRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleJoinRoom(room.id)}
                      className="bg-[#1e2732] rounded-2xl p-6 hover:bg-[#24303f] transition-all cursor-pointer border border-transparent hover:border-blue-500/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                              <Radio size={12} />
                              LIVE
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                              {room.category}
                            </span>
                            {room.isPrivate && (
                              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full flex items-center gap-1">
                                <Lock size={12} />
                                Private
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{room.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users size={16} />
                              <span>{room.participantCount} / {room.maxParticipants}</span>
                            </div>
                            <span>•</span>
                            <span>Hosted by {room.hostName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center ml-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                            {room.hostName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Scheduled Rooms */}
            {scheduledRooms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-gray-400" />
                  <h2 className="text-xl font-bold">Upcoming</h2>
                  <span className="text-gray-500 text-sm">({scheduledRooms.length})</span>
                </div>
                <div className="space-y-4">
                  {scheduledRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleJoinRoom(room.id)}
                      className="bg-[#1e2732] rounded-2xl p-6 hover:bg-[#24303f] cursor-pointer transition-all border border-gray-700 hover:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
                              <Clock size={12} />
                              {room.scheduledStartTime && formatScheduledTime(room.scheduledStartTime)}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                              {room.category}
                            </span>
                            {room.isPrivate && (
                              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full flex items-center gap-1">
                                <Lock size={12} />
                                Private
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{room.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Hosted by {room.hostName}</span>
                            {room.scheduledStartTime && (
                              <>
                                <span>•</span>
                                <span>{room.scheduledStartTime.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center ml-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {room.hostName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Rooms */}
            {pastRooms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-gray-400" />
                  <h2 className="text-xl font-bold">Past Sessions</h2>
                  <span className="text-gray-500 text-sm">({pastRooms.length})</span>
                </div>
                <div className="space-y-4">
                  {pastRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-[#1e2732] rounded-2xl p-6 border border-gray-800 opacity-75"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
                              ENDED
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                              {room.category}
                            </span>
                            {room.isPrivate && (
                              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full flex items-center gap-1">
                                <Lock size={12} />
                                Private
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{room.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Hosted by {room.hostName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center ml-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold">
                            {room.hostName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
