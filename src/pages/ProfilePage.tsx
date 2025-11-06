import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { getDisplayName, formatJoinDate } from '../utils/user';
import { ArrowLeft, Mail, Calendar, Heart, MessageCircle, Users, Settings } from 'lucide-react';

interface UserStats {
  prayerRequestsCount: number;
  amensGiven: number;
  responsesGiven: number;
  circlesJoined: number;
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({
    prayerRequestsCount: 0,
    amensGiven: 0,
    responsesGiven: 0,
    circlesJoined: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const [requestsResult, amensResult, responsesResult, circlesResult] = await Promise.all([
        supabase
          .from('prayer_requests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('prayer_request_amens')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('prayer_request_responses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('circle_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      setStats({
        prayerRequestsCount: requestsResult.count || 0,
        amensGiven: amensResult.count || 0,
        responsesGiven: responsesResult.count || 0,
        circlesJoined: circlesResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <nav className="bg-[#1a1f2e] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={20} />}
          >
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#1a1f2e] rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {getDisplayName(user)}
                </h1>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Mail size={16} />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={16} />
                  <span>Member since {formatJoinDate(user)}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => alert('Settings coming soon!')}
              variant="ghost"
              icon={<Settings size={20} />}
            >
              Settings
            </Button>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold mb-6">Activity Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f1419] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-blue-400" size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.prayerRequestsCount}</div>
              <div className="text-sm text-gray-400">Prayer Requests</div>
            </div>

            <div className="bg-[#0f1419] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="text-red-400" size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.amensGiven}</div>
              <div className="text-sm text-gray-400">Amens Given</div>
            </div>

            <div className="bg-[#0f1419] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-green-400" size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.responsesGiven}</div>
              <div className="text-sm text-gray-400">Responses</div>
            </div>

            <div className="bg-[#0f1419] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="text-purple-400" size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.circlesJoined}</div>
              <div className="text-sm text-gray-400">Circles</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Account Actions</h2>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/prayer-wall')}
              variant="ghost"
              size="lg"
              className="w-full justify-start"
            >
              My Prayer Requests
            </Button>
            <Button
              onClick={() => navigate('/circles')}
              variant="ghost"
              size="lg"
              className="w-full justify-start"
            >
              My Prayer Circles
            </Button>
            <div className="border-t border-gray-700 my-4"></div>
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="lg"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
