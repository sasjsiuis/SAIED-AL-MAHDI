
/**
 * Service to mix voice AudioBuffer with a background music file
 */
export async function mixVoiceWithMusic(
  voiceBlobUrl: string,
  musicUrl: string,
  musicVolume: number = 0.15
): Promise<string> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    // Fetch assets with explicit error checking
    const voiceRes = await fetch(voiceBlobUrl);
    if (!voiceRes.ok) throw new Error(`Voice buffer retrieval failed: ${voiceRes.status}`);

    // Some servers require specific headers or mode for CORS fetch
    const musicRes = await fetch(musicUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit' // Avoid sending cookies to prevent 403 on some CDNs
    }).catch(e => {
      console.error("Music fetch error:", e);
      throw new Error("Background music could not be reached due to a network or CORS error.");
    });

    if (!musicRes.ok) {
      if (musicRes.status === 403) {
        throw new Error("Music track access denied (403 Forbidden). The music provider might be blocking direct downloads. Try a different track.");
      }
      throw new Error(`Music track retrieval failed: ${musicRes.status} ${musicRes.statusText}`);
    }

    const [voiceData, musicData] = await Promise.all([
      voiceRes.arrayBuffer(),
      musicRes.arrayBuffer()
    ]);

    const [voiceBuffer, musicBuffer] = await Promise.all([
      audioCtx.decodeAudioData(voiceData),
      audioCtx.decodeAudioData(musicData)
    ]);

    // Use the voice duration as the base duration
    const duration = voiceBuffer.duration;
    
    // Determine output channels (stereo if either is stereo)
    const outChannels = Math.max(voiceBuffer.numberOfChannels, musicBuffer.numberOfChannels, 2);
    
    const offlineCtx = new OfflineAudioContext(
      outChannels,
      Math.ceil(duration * voiceBuffer.sampleRate),
      voiceBuffer.sampleRate
    );

    // Voice Source
    const voiceSource = offlineCtx.createBufferSource();
    voiceSource.buffer = voiceBuffer;
    const voiceGain = offlineCtx.createGain();
    voiceGain.gain.value = 1.0;
    voiceSource.connect(voiceGain);
    voiceGain.connect(offlineCtx.destination);

    // Music Source
    const musicSource = offlineCtx.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;
    const musicGain = offlineCtx.createGain();
    musicGain.gain.value = musicVolume;
    
    musicSource.connect(musicGain);
    musicGain.connect(offlineCtx.destination);

    // Start both
    voiceSource.start(0);
    musicSource.start(0);

    // Render the mix
    const mixedBuffer = await offlineCtx.startRendering();
    
    // Close context
    await audioCtx.close();
    
    // Convert mixed buffer back to WAV/Blob
    return bufferToWavUrl(mixedBuffer);
  } catch (error: any) {
    console.error("Mixing service error details:", error);
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
    // Re-throw a cleaner message for the UI
    throw new Error(error.message || "An unknown error occurred during audio mixing.");
  }
}

function bufferToWavUrl(buffer: AudioBuffer): string {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); 
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16); 
  setUint16(1); 
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16); 

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for(i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  const wavBlob = new Blob([bufferArray], { type: "audio/wav" });
  return URL.createObjectURL(wavBlob);
}
