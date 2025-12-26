
import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play();
    }
  }, [url, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    setProgress((current / duration) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxgenius-clip-${Date.now()}.wav`;
    link.click();
  };

  return (
    <div className="w-full bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <div className="flex items-center space-x-6">
        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-white text-indigo-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
        >
          {isPlaying ? (
            <i className="fa-solid fa-pause text-2xl"></i>
          ) : (
            <i className="fa-solid fa-play text-2xl ml-1"></i>
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-100">AI Synthesized Audio</span>
            <div className="flex space-x-3">
               <button 
                onClick={handleDownload}
                className="text-indigo-200 hover:text-white transition-colors"
                title="Download clip"
              >
                <i className="fa-solid fa-download"></i>
              </button>
            </div>
          </div>
          <div className="relative h-2 bg-indigo-950/50 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-indigo-400 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
