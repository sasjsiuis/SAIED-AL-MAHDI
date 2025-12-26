
import React from 'react';
import { VoiceProfile } from '../types';

interface VoiceCardProps {
  voice: VoiceProfile;
  isSelected: boolean;
  onSelect: (id: any) => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(voice.id)}
      className={`relative flex flex-col p-4 rounded-2xl transition-all duration-300 border-2 text-left w-full group ${
        isSelected 
          ? 'border-indigo-600 bg-white shadow-xl ring-4 ring-indigo-50 z-10' 
          : 'border-transparent bg-white hover:bg-gray-50 shadow-sm'
      }`}
    >
      <div className="flex items-start space-x-3 w-full">
        <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden ${voice.color} shadow-lg shadow-black/5`}>
          <img 
            src={voice.avatar} 
            alt={voice.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`font-bold text-base truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
              {voice.name}
            </h3>
            {isSelected && <i className="fa-solid fa-circle-check text-indigo-600 text-sm"></i>}
          </div>
          
          <div className="flex flex-wrap gap-1 mb-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tight ${
              voice.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 
              voice.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {voice.gender}
            </span>
            {voice.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                {tag}
              </span>
            ))}
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {voice.description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default VoiceCard;
