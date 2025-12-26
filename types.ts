
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
  Aoede = 'aoede',
  Achird = 'achird',
  Orus = 'orus',
  Leda = 'leda'
}

export interface VoiceProfile {
  id: string;
  apiVoice: string;
  name: string;
  description: string;
  gender: 'Male' | 'Female' | 'Neutral';
  avatar: string;
  color: string;
  tags: string[];
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface GeneratedClip {
  id: string;
  text: string;
  voiceId: string;
  musicId?: string;
  timestamp: number;
  audioUrl: string;
}

export interface SpeechSettings {
  voice: string;
  emotion: string;
  text: string;
}
