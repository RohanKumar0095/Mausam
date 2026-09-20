/**
 * MAUSAM Voice & Speech Synthesis Service
 * 
 * Manages language-aware Speech Recognition (STT) and Speech Synthesis (TTS).
 * Ensures Hindi (hi-IN) uses genuine Hindi voice synthesizers and never falls back
 * to English voices for Hindi text.
 */

/**
 * Retrieve all currently loaded SpeechSynthesis voices with async event fallback
 */
export function getAvailableVoices() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load asynchronously (Chromium / WebKit)
    const onVoicesChanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(updatedVoices || []);
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Timeout safety fallback (500ms)
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 500);
  });
}

/**
 * Select genuine language-specific voice for TTS
 * 
 * @param {string} lang - 'hi' | 'en' | 'Hindi' | 'English'
 * @param {Array<SpeechSynthesisVoice>} voices - Loaded voices list
 * @returns {{ voice: SpeechSynthesisVoice | null, available: boolean, voiceName: string, locale: string, error?: string }}
 */
export function getVoiceForLanguage(lang = 'en', voices = []) {
  const isHindi = lang === 'hi' || lang === 'Hindi';

  if (!voices || voices.length === 0) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      voices = window.speechSynthesis.getVoices() || [];
    }
  }

  // -------------------------------------------------------------
  // 1. HINDI VOICE SELECTION (hi-IN)
  // -------------------------------------------------------------
  if (isHindi) {
    // Exact hi-IN match
    let hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN');

    // General Hindi locale match
    if (!hindiVoice) {
      hindiVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('hi'));
    }

    // Known Hindi synthesizer names (Lekha, Kalpana, Hemant, Swara, Neerja, Madhur, Google हिन्दी)
    if (!hindiVoice) {
      hindiVoice = voices.find(v => {
        const name = (v.name || '').toLowerCase();
        return (
          name.includes('hindi') || 
          name.includes('हिन्दी') ||
          name.includes('lekha') || 
          name.includes('kalpana') || 
          name.includes('hemant') ||
          name.includes('neerja') ||
          name.includes('swara') ||
          name.includes('madhur')
        );
      });
    }

    if (hindiVoice) {
      return {
        voice: hindiVoice,
        available: true,
        voiceName: hindiVoice.name,
        locale: hindiVoice.lang || 'hi-IN'
      };
    }

    // IMPORTANT: Never return an English voice for Hindi text
    return {
      voice: null,
      available: false,
      voiceName: 'None',
      locale: 'hi-IN',
      error: 'इस डिवाइस या ब्राउज़र पर हिंदी आवाज़ उपलब्ध नहीं है।'
    };
  }

  // -------------------------------------------------------------
  // 2. ENGLISH VOICE SELECTION (en-IN preferred, then en-*)
  // -------------------------------------------------------------
  // Prefer Indian English (en-IN)
  let englishVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');

  // Any English voice (en-US, en-GB, en-AU, etc.)
  if (!englishVoice) {
    englishVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
  }

  // Default system voice
  if (!englishVoice) {
    englishVoice = voices.find(v => v.default) || voices[0] || null;
  }

  return {
    voice: englishVoice,
    available: Boolean(englishVoice),
    voiceName: englishVoice?.name || 'Default English',
    locale: englishVoice?.lang || 'en-IN'
  };
}

/**
 * Execute Speech Synthesis with language verification
 */
export function speakText({
  text,
  language = 'en',
  voices = [],
  onStart,
  onEnd,
  onError
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) {
      onError({
        message: language === 'hi' 
          ? 'इस ब्राउज़र में वॉइस आउटपुट उपलब्ध नहीं है।' 
          : 'Voice output is not supported on this browser.'
      });
    }
    return null;
  }

  // Stop any active speech
  window.speechSynthesis.cancel();

  const isHindi = language === 'hi' || language === 'Hindi';
  const voiceResult = getVoiceForLanguage(language, voices);

  // If Hindi requested but no Hindi voice available, reject cleanly
  if (isHindi && !voiceResult.available) {
    if (onError) {
      onError({
        message: 'इस डिवाइस या ब्राउज़र पर हिंदी आवाज़ उपलब्ध नहीं है।'
      });
    }
    return null;
  }

  if (!voiceResult.voice) {
    if (onError) {
      onError({
        message: isHindi 
          ? 'इस डिवाइस या ब्राउज़र पर हिंदी आवाज़ उपलब्ध नहीं है।' 
          : 'English speech voice is unavailable on this device.'
      });
    }
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voiceResult.voice;
  utterance.lang = voiceResult.locale || (isHindi ? 'hi-IN' : 'en-IN');
  utterance.rate = isHindi ? 0.95 : 1.0;
  utterance.pitch = 1.0;

  // Developer diagnostic
  if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
    console.log('[MAUSAM TTS Diagnostic]', {
      selectedLanguage: isHindi ? 'Hindi (hi)' : 'English (en)',
      requestedVoiceLocale: isHindi ? 'hi-IN' : 'en-IN',
      selectedVoiceName: voiceResult.voice.name,
      voiceLanguage: voiceResult.voice.lang
    });
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}
