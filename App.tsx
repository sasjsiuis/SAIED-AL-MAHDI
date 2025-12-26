
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { VOICES as INITIAL_VOICES, EMOTIONS, MUSIC_TRACKS } from './constants';
import { GeneratedClip, VoiceProfile } from './types';
import VoiceCard from './components/VoiceCard';
import AudioPlayer from './components/AudioPlayer';
import { generateSpeech } from './services/geminiService';
import { mixVoiceWithMusic } from './services/audioMixerService';

const App: React.FC = () => {
  const [voices, setVoices] = useState<VoiceProfile[]>(INITIAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(INITIAL_VOICES[0].id);
  const [selectedEmotion, setSelectedEmotion] = useState(EMOTIONS[0].label);
  const [selectedMusicId, setSelectedMusicId] = useState<string>(MUSIC_TRACKS[0].id);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [previewingMusicId, setPreviewingMusicId] = useState<string | null>(null);
  
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentClip, setCurrentClip] = useState<GeneratedClip | null>(null);
  const [history, setHistory] = useState<GeneratedClip[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Audio preview ref for music tracks
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Cloning State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneStep, setCloneStep] = useState(1); 
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           voice.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGender = genderFilter === 'All' || voice.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [voices, searchQuery, genderFilter]);

  const handlePreviewMusic = (track: any) => {
    if (!track.url) return;
    
    if (previewingMusicId === track.id) {
      previewAudioRef.current?.pause();
      setPreviewingMusicId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = track.url;
        previewAudioRef.current.volume = 0.3; // Default preview volume
        previewAudioRef.current.play();
        setPreviewingMusicId(track.id);
      }
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text to synthesize.");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    // Stop any music preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewingMusicId(null);
    }
    
    let voiceAudioUrl = "";
    try {
      const selectedVoice = voices.find(v => v.id === selectedVoiceId);
      if (!selectedVoice) throw new Error("Voice profile not found");

      const emotionPrompt = EMOTIONS.find(e => e.label === selectedEmotion)?.prompt || '';
      
      // Step 1: Generate the base voice
      voiceAudioUrl = await generateSpeech(text, selectedVoice.apiVoice, emotionPrompt);
      let finalAudioUrl = voiceAudioUrl;
      
      // Step 2: If music is selected, attempt to mix it
      const selectedMusic = MUSIC_TRACKS.find(m => m.id === selectedMusicId);
      if (selectedMusic && selectedMusic.url) {
        try {
          finalAudioUrl = await mixVoiceWithMusic(voiceAudioUrl, selectedMusic.url, musicVolume);
        } catch (mixErr: any) {
          console.warn("Mixing failed, falling back to voice-only:", mixErr);
          setError("Warning: Music mixing failed. Showing voice-only version. (Error: " + mixErr.message + ")");
          // Keep finalAudioUrl as voiceAudioUrl
        }
      }
      
      const newClip: GeneratedClip = {
        id: crypto.randomUUID(),
        text: text,
        voiceId: selectedVoiceId,
        musicId: selectedMusicId,
        timestamp: Date.now(),
        audioUrl: finalAudioUrl
      };
      
      setCurrentClip(newClip);
      setHistory(prev => [newClip, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(err.message || "Failed to generate audio. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const finalizeClone = () => {
    setCloneStep(2);
    const supportedCloningVoices = ['achernar', 'algenib', 'algieba', 'alnilam', 'umbriel', 'despina', 'fenrir'];
    const randomApiVoice = supportedCloningVoices[Math.floor(Math.random() * supportedCloningVoices.length)];
    setTimeout(() => {
      const newVoice: VoiceProfile = {
        id: `custom-${Date.now()}`, 
        apiVoice: randomApiVoice,
        name: cloneName || "My Clone",
        description: "Custom cloned voice via neural analysis.",
        gender: "Neutral",
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cloneName}`,
        color: "bg-fuchsia-500",
        tags: ["Cloned", "Custom"]
      };
      setVoices(prev => [newVoice, ...prev]);
      setSelectedVoiceId(newVoice.id);
      setCloneStep(3);
      setTimeout(() => {
        setIsCloneModalOpen(false);
        setCloneStep(1);
        setCloneName('');
        setRecordedBlob(null);
      }, 1500);
    }, 3000);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <audio ref={previewAudioRef} onEnded={() => setPreviewingMusicId(null)} />
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
              <i className="fa-solid fa-microphone-lines text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              VoxGenius
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Script Editor</h2>
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.label}
                      onClick={() => setSelectedEmotion(emotion.label)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedEmotion === emotion.label 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {emotion.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group mb-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="আপনার স্ক্রিপ্ট এখানে লিখুন..."
                  className="w-full h-64 p-6 text-lg text-slate-800 placeholder-slate-300 bg-slate-50/50 rounded-2xl border-2 border-transparent focus:border-indigo-100 focus:bg-white focus:outline-none transition-all resize-none"
                ></textarea>
                <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-400 bg-white/80 px-2 py-1 rounded">
                  {text.length}/1000
                </div>
              </div>

              {/* Background Music Selector */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Background Music</h3>
                  {selectedMusicId !== 'none' && (
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-bold text-slate-400">VOLUME: {Math.round(musicVolume * 100)}%</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="0.5" 
                        step="0.01" 
                        value={musicVolume} 
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className="w-24 h-1.5 bg-slate-100 rounded-full appearance-none accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {MUSIC_TRACKS.map((music) => (
                    <div key={music.id} className="relative group">
                      <button
                        onClick={() => setSelectedMusicId(music.id)}
                        className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          selectedMusicId === music.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <i className={`fa-solid ${music.icon} text-lg mb-2`}></i>
                        <span className="text-[10px] font-bold uppercase truncate w-full text-center px-1">{music.name}</span>
                      </button>
                      
                      {music.url && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePreviewMusic(music); }}
                          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors ${
                            previewingMusicId === music.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:text-indigo-600'
                          }`}
                          title="Preview Track"
                        >
                          <i className={`fa-solid ${previewingMusicId === music.id ? 'fa-pause text-[10px]' : 'fa-play text-[10px]'}`}></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 shadow-xl transition-all ${
                    isGenerating || !text.trim()
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-200'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <i className="fa-solid fa-sparkles animate-pulse"></i>
                      <span>Mixing & Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Generate Voice & Music</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className={`mt-4 p-4 rounded-xl flex items-center space-x-3 text-sm ${error.startsWith('Warning') ? 'bg-amber-50 border border-amber-100 text-amber-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                  <i className={`fa-solid ${error.startsWith('Warning') ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}`}></i>
                  <span>{error}</span>
                </div>
              )}
            </section>

            {currentClip && (
              <div className="bg-white p-2 rounded-3xl shadow-lg border border-indigo-50">
                <AudioPlayer url={currentClip.audioUrl} autoPlay />
              </div>
            )}

            {history.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 px-2">Studio History</h3>
                <div className="grid gap-3">
                  {history.map((clip) => (
                    <div 
                      key={clip.id} 
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all cursor-pointer"
                      onClick={() => setCurrentClip(clip)}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 group-hover:bg-indigo-50">
                          <i className="fa-solid fa-waveform text-indigo-400"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-700 truncate">{clip.text}</p>
                          <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-slate-400">
                            <span className="text-indigo-600">{voices.find(v => v.id === clip.voiceId)?.name}</span>
                            <span>•</span>
                            <span className="text-slate-500">{MUSIC_TRACKS.find(m => m.id === clip.musicId)?.name}</span>
                            <span>•</span>
                            <span>{new Date(clip.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                      <i className="fa-solid fa-circle-play text-2xl text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Voice Library</h2>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded uppercase">Studio Grade</span>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input 
                    type="text" 
                    placeholder="Search by name or style..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar pr-2">
                  {filteredVoices.map((voice) => (
                    <VoiceCard
                      key={voice.id}
                      voice={voice}
                      isSelected={selectedVoiceId === voice.id}
                      onSelect={setSelectedVoiceId}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setIsCloneModalOpen(true)}
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-indigo-50 text-indigo-600 group w-full transition-all hover:bg-indigo-600 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Clone Your Voice</p>
                    <p className="text-[10px] font-bold uppercase opacity-60">Neural Profile Analysis</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clone Modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isRecording && setIsCloneModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Neural Clone</h3>
                <p className="text-sm text-slate-500">Create a digital voice double</p>
              </div>
              {!isRecording && (
                <button onClick={() => setIsCloneModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {cloneStep === 1 && (
              <div className="space-y-6">
                <div className="aspect-video bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="flex items-center space-x-1 h-8 mb-4">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 bg-indigo-500 rounded-full transition-all ${isRecording ? 'animate-bounce h-8' : 'h-2'}`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRecording ? 'bg-red-500 scale-110' : 'bg-indigo-600'}`}>
                    <i className={`fa-solid ${isRecording ? 'fa-square' : 'fa-microphone'} text-white text-xl`}></i>
                  </div>
                  <p className="mt-4 text-slate-400 font-mono text-sm tracking-widest">{recordingTime}S / 10S</p>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Give your clone a name..." 
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl outline-none font-medium"
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${isRecording ? 'bg-red-500 shadow-red-100' : 'bg-indigo-600 shadow-indigo-100'}`}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  {recordedBlob && !isRecording && (
                     <button 
                      onClick={finalizeClone}
                      disabled={!cloneName.trim()}
                      className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-100 disabled:opacity-50"
                    >
                      Finish Clone
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {cloneStep === 2 && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="text-xl font-bold text-slate-900">Training Neural Weights</p>
                  <p className="text-sm text-slate-500 mt-1">Analyzing frequency response and timbre...</p>
                </div>
              </div>
            )}
            
            {cloneStep === 3 && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">Cloning Complete!</p>
                  <p className="text-sm text-slate-500 mt-1">{cloneName} is now available in your library.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default App;
