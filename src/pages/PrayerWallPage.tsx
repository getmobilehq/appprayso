import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PrayerRequest } from '../types';
import { PrayerRequestCard } from '../components/PrayerRequestCard';
import { Button } from '../components/Button';
import { NotificationBell } from '../components/NotificationBell';
import { Plus, ArrowLeft, Filter, Search, TrendingUp, Clock, Heart } from 'lucide-react';

const categories = [
  'All',
  'General Prayer',
  'Healing',
  'Thanksgiving',
  'Intercession',
  'Worship',
  'Family',
  'Guidance',
  'Strength',
];

export function PrayerWallPage() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'mostAmens'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('prayer_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, sortBy]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('prayer_requests')
        .select('*');

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      switch (sortBy) {
        case 'latest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('response_count', { ascending: false });
          break;
        case 'mostAmens':
          query = query.order('amen_count', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      const requestsData = data.map((req) => ({
        id: req.id,
        userId: req.user_id,
        userName: req.user_name,
        title: req.title,
        content: req.content,
        category: req.category,
        amenCount: req.amen_count,
        responseCount: req.response_count,
        isAnswered: req.is_answered,
        createdAt: new Date(req.created_at),
        updatedAt: new Date(req.updated_at),
      })) as PrayerRequest[];

      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.title.toLowerCase().includes(query) ||
      request.content.toLowerCase().includes(query) ||
      request.userName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#15202b]">
      <nav className="bg-[#1e2732] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                icon={<ArrowLeft size={18} />}
                className="flex-shrink-0"
              >
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-400 truncate">Prayer Wall</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Share and support prayer requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                onClick={() => navigate('/create-prayer-request')}
                variant="primary"
                size="md"
                icon={<Plus size={20} />}
                className="flex-shrink-0"
              >
                New Request
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prayer requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1e2732] border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={20} className="text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Category</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'primary' : 'secondary'}
                    size="sm"
                    className="text-sm"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} className="text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Sort By</h2>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setSortBy('latest')}
                  variant={sortBy === 'latest' ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<Clock size={16} />}
                  fullWidth
                >
                  Latest
                </Button>
                <Button
                  onClick={() => setSortBy('popular')}
                  variant={sortBy === 'popular' ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<TrendingUp size={16} />}
                  fullWidth
                >
                  Most Responses
                </Button>
                <Button
                  onClick={() => setSortBy('mostAmens')}
                  variant={sortBy === 'mostAmens' ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<Heart size={16} />}
                  fullWidth
                >
                  Most Amens
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Loading prayer requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">
              {searchQuery
                ? `No prayer requests found for "${searchQuery}"`
                : selectedCategory === 'All'
                ? 'No prayer requests yet'
                : `No prayer requests in ${selectedCategory}`}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/create-prayer-request')}
                variant="primary"
                size="lg"
              >
                Be the first to share
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 text-gray-400 text-sm">
              Showing {filteredRequests.length} prayer request{filteredRequests.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <PrayerRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
