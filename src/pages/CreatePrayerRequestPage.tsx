import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'Healing',
  'Family',
  'Financial',
  'Career',
  'Relationships',
  'Spiritual Growth',
  'Guidance',
  'Thanksgiving',
  'Intercession',
  'Other'
];

export function CreatePrayerRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Healing'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .insert({
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Anonymous',
          title: formData.title,
          content: formData.content,
          category: formData.category,
          amen_count: 0,
          response_count: 0,
          is_answered: false
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/prayer-request/${data.id}`);
    } catch (error) {
      console.error('Error creating prayer request:', error);
      alert('Failed to create prayer request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-[#1a1f2e] rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Share a Prayer Request</h1>
          <p className="text-gray-400 mb-8">
            Share your prayer needs with the community and receive support
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Request Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Prayer for healing"
                maxLength={100}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
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
              <label className="block text-sm font-medium mb-2">
                Prayer Request <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your prayer request in detail. The community will pray with you and offer encouragement."
                rows={10}
                maxLength={2000}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000 characters
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Your prayer request will be visible to all members of the community.
                Please avoid sharing sensitive personal information.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/prayer-wall')}
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
                {loading ? 'Posting...' : 'Post Prayer Request'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
