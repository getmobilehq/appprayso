import { useNavigate } from 'react-router-dom';
import { PrayerRequest } from '../types';
import { Heart, MessageCircle } from 'lucide-react';

interface PrayerRequestCardProps {
  request: PrayerRequest;
}

export function PrayerRequestCard({ request }: PrayerRequestCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/prayer-request/${request.id}`)}
      className="bg-[#1e2732] rounded-xl p-6 hover:bg-[#24303f] transition-all border border-gray-800 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
          {request.category}
        </span>
        {request.isAnswered && (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
            Answered
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{request.title}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">{request.content}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">by {request.userName}</span>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-1">
            <Heart size={16} />
            <span>{request.amenCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={16} />
            <span>{request.responseCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
