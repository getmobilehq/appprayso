import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { ArrowLeft, Heart, MessageCircle, Send, CheckCircle } from 'lucide-react';

interface RequestDetails {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  category: string;
  amen_count: number;
  response_count: number;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
}

interface Response {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export function PrayerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasAmened, setHasAmened] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
    fetchResponses();
    checkIfAmened();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setRequest(data);
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_request_responses')
        .select('*')
        .eq('prayer_request_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setResponses(data);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const checkIfAmened = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prayer_request_amens')
        .select('id')
        .eq('prayer_request_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasAmened(!!data);
    } catch (error) {
      console.error('Error checking amen:', error);
    }
  };

  const handleAmen = async () => {
    if (!user || !request) return;

    try {
      if (hasAmened) {
        const { error } = await supabase
          .from('prayer_request_amens')
          .delete()
          .eq('prayer_request_id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setRequest({
          ...request,
          amen_count: Math.max(0, request.amen_count - 1)
        });
        setHasAmened(false);
      } else {
        const { error } = await supabase
          .from('prayer_request_amens')
          .insert({
            prayer_request_id: id,
            user_id: user.id
          });

        if (error) throw error;

        setRequest({
          ...request,
          amen_count: request.amen_count + 1
        });
        setHasAmened(true);
      }
    } catch (error) {
      console.error('Error toggling amen:', error);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('prayer_request_responses')
        .insert({
          prayer_request_id: id,
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Anonymous',
          content: newResponse.trim()
        });

      if (error) throw error;

      setNewResponse('');
      fetchResponses();
      fetchRequestDetails();
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleMarkAsAnswered = async () => {
    if (!request || request.user_id !== user?.id) return;

    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ is_answered: !request.is_answered })
        .eq('id', id);

      if (error) throw error;

      setRequest({
        ...request,
        is_answered: !request.is_answered
      });
    } catch (error) {
      console.error('Error marking as answered:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading prayer request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419] text-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Prayer request not found</p>
          <Button onClick={() => navigate('/prayer-wall')} variant="primary">
            Go to Prayer Wall
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <nav className="bg-[#1a1f2e] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            onClick={() => navigate('/prayer-wall')}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={20} />}
          >
            Back to Prayer Wall
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#1a1f2e] rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                  {request.category}
                </span>
                {request.is_answered && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    Answered
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{request.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <span>By {request.user_name}</span>
                <span>•</span>
                <span>{new Date(request.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-lg leading-relaxed mb-8 whitespace-pre-wrap">
            {request.content}
          </p>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-700">
            <Button
              onClick={handleAmen}
              variant={hasAmened ? 'primary' : 'ghost'}
              size="md"
              icon={<Heart size={20} fill={hasAmened ? 'currentColor' : 'none'} />}
            >
              {request.amen_count} {request.amen_count === 1 ? 'Amen' : 'Amens'}
            </Button>
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle size={20} />
              <span>{request.response_count} {request.response_count === 1 ? 'Response' : 'Responses'}</span>
            </div>
            {request.user_id === user?.id && (
              <Button
                onClick={handleMarkAsAnswered}
                variant="ghost"
                size="md"
                icon={<CheckCircle size={20} />}
                className="ml-auto"
              >
                {request.is_answered ? 'Mark as Unanswered' : 'Mark as Answered'}
              </Button>
            )}
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle size={24} />
            Responses ({responses.length})
          </h2>

          <form onSubmit={handleSubmitResponse} className="mb-8">
            <textarea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="Share your prayer or encouragement..."
              rows={3}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={<Send size={20} />}
                disabled={!newResponse.trim()}
              >
                Post Response
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No responses yet. Be the first to respond!</p>
              </div>
            ) : (
              responses.map((response) => (
                <div key={response.id} className="bg-[#0f1419] rounded-lg p-6 border border-gray-800">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-semibold">{response.user_name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(response.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {response.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
