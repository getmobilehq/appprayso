import { useEffect, useRef, useState } from 'react';

interface AudioEqualizerProps {
  isActive: boolean;
  isMuted: boolean;
  barCount?: number;
}

export function AudioEqualizer({ isActive, isMuted, barCount = 7 }: AudioEqualizerProps) {
  const [barHeights, setBarHeights] = useState<number[]>(Array(barCount).fill(20));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && !isMuted) {
      startAudioVisualization();
    } else {
      stopAudioVisualization();
      setBarHeights(Array(barCount).fill(20));
    }

    return () => {
      stopAudioVisualization();
    };
  }, [isActive, isMuted, barCount]);

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      visualize();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateBars = () => {
      if (!analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);

      const segmentSize = Math.floor(bufferLength / barCount);
      const newHeights = Array(barCount).fill(0).map((_, index) => {
        const start = index * segmentSize;
        const end = start + segmentSize;
        const segment = dataArray.slice(start, end);
        const average = segment.reduce((sum, val) => sum + val, 0) / segment.length;

        const normalizedHeight = Math.max(20, Math.min(100, (average / 255) * 100 + 20));
        return normalizedHeight;
      });

      setBarHeights(newHeights);
      animationFrameRef.current = requestAnimationFrame(updateBars);
    };

    updateBars();
  };

  return (
    <div className="flex items-center justify-center gap-1.5 h-16">
      {barHeights.map((height, index) => (
        <div
          key={index}
          className={`w-2 rounded-full transition-all duration-75 ${
            isActive && !isMuted ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gray-600'
          }`}
          style={{
            height: `${height}%`,
          }}
        />
      ))}
    </div>
  );
}
