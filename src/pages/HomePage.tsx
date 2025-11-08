import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PrayerRoom } from '../types';
import { Button } from '../components/Button';
import { NotificationBell } from '../components/NotificationBell';
import { Plus, LogOut, BookHeart, UserCircle, Users, Radio, CircleDot, Lock, Clock, Play, Calendar, ListChecks } from 'lucide-react';

export function HomePage() {
  const [liveRooms, setLiveRooms] = useState<PrayerRoom[]>([]);
  const [scheduledRooms, setScheduledRooms] = useState<PrayerRoom[]>([]);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [goingLive, setGoingLive] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('photo_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.photo_url) {
        setUserPhotoUrl(profile.photo_url);
      }
    };

    fetchUserProfile();

    const fetchRooms = async () => {
      if (!user) return;

      const { data: roomsData, error: roomsError } = await supabase
        .from('prayer_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
      }

      const userCircleIds = new Set(memberships?.map((m) => m.circle_id) || []);

      const accessibleRooms = roomsData.filter((room) => {
        if (!room.is_private) return true;
        if (room.circle_id && userCircleIds.has(room.circle_id)) return true;
        return false;
      });

      const rooms = accessibleRooms.map((room) => ({
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

      const live = rooms.filter(r => r.status === 'live');
      const scheduled = rooms.filter(r => r.status === 'scheduled');

      setLiveRooms(live);
      setScheduledRooms(scheduled);
    };

    fetchRooms();

    const channel = supabase
      .channel('prayer_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_rooms',
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGoLive = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGoingLive(roomId);

    try {
      const { error } = await supabase
        .from('prayer_rooms')
        .update({ status: 'live' })
        .eq('id', roomId);

      if (error) throw error;

      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error going live:', error);
      alert('Failed to go live. Please try again.');
    } finally {
      setGoingLive(null);
    }
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

  return (
    <div className="min-h-screen bg-[#15202b] text-white">
      <nav className="bg-[#1e2732] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img
              src="/pray.so white copy copy.svg"
              alt="Pray.so"
              className="h-6 sm:h-8 w-auto"
            />
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={() => navigate('/my-rooms')}
                variant="ghost"
                size="sm"
                icon={<ListChecks size={20} />}
                className="px-2 sm:px-3"
                title="My Rooms"
              />
              <Button
                onClick={() => navigate('/circles')}
                variant="ghost"
                size="sm"
                icon={<CircleDot size={20} />}
                className="px-2 sm:px-3"
              />
              <Button
                onClick={() => navigate('/prayer-wall')}
                variant="ghost"
                size="sm"
                icon={<BookHeart size={20} />}
                className="px-2 sm:px-3"
              />
              <NotificationBell />
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                title="My Profile"
              >
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    <UserCircle size={20} />
                  </div>
                )}
              </button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                icon={<LogOut size={20} />}
                className="px-2 sm:px-3 hover:text-red-400"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Prayer Rooms</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Join live sessions or schedule your own</p>
            </div>
            <Button
              onClick={handleCreateRoom}
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
              className="whitespace-nowrap"
            >
              Create Room
            </Button>
          </div>
        </div>

        {liveRooms.length === 0 && scheduledRooms.length === 0 ? (
          <div className="text-center py-16 bg-[#1e2732] rounded-2xl">
            <Radio size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-4">No rooms right now</p>
            <Button
              onClick={handleCreateRoom}
              variant="primary"
              size="lg"
            >
              Create the First Room
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
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

            {scheduledRooms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-gray-400" />
                  <h2 className="text-xl font-bold">Scheduled</h2>
                  <span className="text-gray-500 text-sm">({scheduledRooms.length})</span>
                </div>
                <div className="space-y-4">
                  {scheduledRooms.map((room) => {
                    const isHost = room.hostId === user?.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => !isHost && handleJoinRoom(room.id)}
                        className={`bg-[#1e2732] rounded-2xl p-6 transition-all border border-gray-700 ${
                          !isHost ? 'hover:bg-[#24303f] cursor-pointer hover:border-gray-600' : ''
                        }`}
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
                              {isHost && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
                                  HOST
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
                          <div className="flex flex-col items-center gap-2 ml-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {room.hostName.charAt(0).toUpperCase()}
                            </div>
                            {isHost && (
                              <button
                                onClick={(e) => handleGoLive(room.id, e)}
                                disabled={goingLive === room.id}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm flex items-center gap-1.5 disabled:bg-gray-600 disabled:cursor-not-allowed"
                              >
                                <Play size={14} />
                                {goingLive === room.id ? 'Starting...' : 'Go Live'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
