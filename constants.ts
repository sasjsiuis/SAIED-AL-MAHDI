
import { VoiceName, VoiceProfile, MusicTrack } from './types';

export const VOICES: VoiceProfile[] = [
  {
    id: VoiceName.Kore,
    apiVoice: VoiceName.Kore,
    name: 'Kore',
    description: 'Calm, professional, and trustworthy. Perfect for narrations.',
    gender: 'Female',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kore',
    color: 'bg-indigo-500',
    tags: ['Narrative', 'Corporate']
  },
  {
    id: VoiceName.Puck,
    apiVoice: VoiceName.Puck,
    name: 'Puck',
    description: 'Energetic, youthful, and vibrant. Great for social media.',
    gender: 'Male',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Puck',
    color: 'bg-amber-500',
    tags: ['Social', 'Upbeat']
  },
  {
    id: VoiceName.Charon,
    apiVoice: VoiceName.Charon,
    name: 'Charon',
    description: 'Deep, resonant, and authoritative. Ideal for documentaries.',
    gender: 'Male',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charon',
    color: 'bg-emerald-500',
    tags: ['Documentary', 'Deep']
  },
  {
    id: VoiceName.Fenrir,
    apiVoice: VoiceName.Fenrir,
    name: 'Fenrir',
    description: 'Bold, expressive, and dynamic. Good for storytelling.',
    gender: 'Male',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fenrir',
    color: 'bg-rose-500',
    tags: ['Drama', 'Powerful']
  },
  {
    id: VoiceName.Zephyr,
    apiVoice: VoiceName.Zephyr,
    name: 'Zephyr',
    description: 'Ethereal, soft, and soothing. Perfect for relaxation content.',
    gender: 'Female',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zephyr',
    color: 'bg-violet-500',
    tags: ['ASMR', 'Relaxing']
  }
];

// Using more reliable CORS-enabled assets for background music
export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'none', name: 'No Music', url: '', icon: 'fa-volume-xmark' },
  { id: 'cinematic', name: 'Cinematic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', icon: 'fa-film' },
  { id: 'lofi', name: 'Lo-Fi Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', icon: 'fa-mug-hot' },
  { id: 'corporate', name: 'Corporate', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', icon: 'fa-briefcase' },
  { id: 'upbeat', name: 'Upbeat Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', icon: 'fa-bolt' },
  { id: 'ambient', name: 'Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', icon: 'fa-wind' }
];

export const EMOTIONS = [
  { label: 'Neutral', prompt: 'Say naturally: ' },
  { label: 'Cheerful', prompt: 'Say cheerfully: ' },
  { label: 'Serious', prompt: 'Say seriously: ' },
  { label: 'Excited', prompt: 'Say excitedly: ' },
  { label: 'Whispering', prompt: 'Whisper: ' },
  { label: 'Angry', prompt: 'Say angrily: ' }
];
