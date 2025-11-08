import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { ArrowLeft, Clock, Users, Lock, Unlock } from 'lucide-react';

const CATEGORIES = [
  'Morning Prayer',
  'Evening Prayer',
  'Bible Study',
  'Intercession',
  'Worship',
  'Thanksgiving',
  'Youth Prayer',
  'Family Prayer',
  'Other'
];

export function CreateRoomPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Morning Prayer',
    isPrivate: false,
    maxParticipants: 50,
    status: 'scheduled' as 'live' | 'scheduled',
    scheduledStartTime: '',
    scheduledEndTime: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const roomData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        is_private: formData.isPrivate,
        max_participants: formData.maxParticipants,
        status: formData.status,
        host_id: user.id,
        host_name: user.email?.split('@')[0] || 'Anonymous',
        participant_count: 0
      };

      // Only include scheduled times if they're actually set
      if (formData.scheduledStartTime) {
        roomData.scheduled_start_time = formData.scheduledStartTime;
      }
      if (formData.scheduledEndTime) {
        roomData.scheduled_end_time = formData.scheduledEndTime;
      }

      const { data, error } = await supabase
        .from('prayer_rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw error;

      navigate(`/room/${data.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Back
          </Button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-[#1a1f2e] rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Create Prayer Room</h1>
          <p className="text-gray-400 mb-8">
            Start a prayer room and invite others to join you
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Prayer Session"
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this prayer room is about..."
                rows={4}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Participants</label>
              <input
                type="number"
                min="2"
                max="1000"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Privacy</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPrivate: false })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !formData.isPrivate
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-[#0f1419]'
                  }`}
                >
                  <Unlock size={24} className="mx-auto mb-2" />
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-gray-400 mt-1">Anyone can join</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPrivate: true })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    formData.isPrivate
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-[#0f1419]'
                  }`}
                >
                  <Lock size={24} className="mx-auto mb-2" />
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-gray-400 mt-1">Invite only</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Room Type</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'scheduled', scheduledStartTime: '', scheduledEndTime: '' })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    formData.status === 'scheduled' && !formData.scheduledStartTime
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-[#0f1419]'
                  }`}
                >
                  <Users size={24} className="mx-auto mb-2" />
                  <div className="font-medium">Ready to Go Live</div>
                  <div className="text-xs text-gray-400 mt-1">Create now, go live when ready</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'scheduled', scheduledStartTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16) })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    formData.status === 'scheduled' && formData.scheduledStartTime
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-[#0f1419]'
                  }`}
                >
                  <Clock size={24} className="mx-auto mb-2" />
                  <div className="font-medium">Schedule for Later</div>
                  <div className="text-xs text-gray-400 mt-1">Set a specific start time</div>
                </button>
              </div>
            </div>

            {formData.scheduledStartTime && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledStartTime}
                    onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledEndTime}
                    onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/')}
                variant="ghost"
                size="lg"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
