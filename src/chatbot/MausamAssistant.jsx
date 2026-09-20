import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Trophy, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Flame, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { generateChatbotResponse } from './chatbotEngine';
import { buildChatbotContext } from './chatbotContext';
import { useI18n } from '../i18n/i18nContext';
import { getAvailableVoices, getVoiceForLanguage, speakText } from './voiceService';

export default function MausamAssistant({
  isOpen,
  onClose,
  user,
  selectedPersonas = ['sportsperson'],
  currentLocation = {},
  currentTime = '17:00',
  currentActivity = null,
  routine = [],
  savedLocations = [],
  weatherData = {},
  safetyInfo = {},
  isWeatherError = false
}) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  // Helper to generate initial welcome greeting based on active language
  const getInitialWelcomeMessage = useCallback((lang) => {
    const isH = lang === 'hi' || lang === 'Hindi';
    return {
      id: 'msg-welcome',
      sender: 'bot',
      structured: {
        answer: isH
          ? 'नमस्ते! मैं आपका MAUSAM खिलाड़ी मौसम सहायक हूँ।'
          : 'Welcome! I am your personalized MAUSAM Sportsperson Weather Assistant.',
        why: isH
          ? 'मैं आपके खेल मैदान, प्रशिक्षण दिनचर्या, बारिश के जोखिम, WBGT तापीय तनाव और सतह की स्थिति का वास्तविक समय में विश्लेषण करता हूँ।'
          : 'I evaluate training windows, field traction, rain probabilities, WBGT heat stress, and safety overrides based on your schedule.',
        action: isH
          ? 'नीचे दिए गए त्वरित प्रश्नों पर टैप करें या अपने अभ्यास के बारे में बोलकर या लिखकर पूछें।'
          : 'Tap the quick questions below or ask about your training feasibility via voice or text.',
        safety: null,
        metrics: null,
        disclaimer: isH ? 'आधिकारिक IMD नियम-आधारित मौसम-से-कार्यवाही इंजन।' : 'Deterministic IMD rule-based weather-to-action engine.'
      },
      timestamp: currentTime
    };
  }, [currentTime]);

  const [messages, setMessages] = useState(() => [getInitialWelcomeMessage(language)]);
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load available speech synthesis voices on startup and when voiceschanged fires
  useEffect(() => {
    getAvailableVoices().then(voices => {
      setAvailableVoices(voices);
    });

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        setAvailableVoices(window.speechSynthesis.getVoices() || []);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  // Update initial welcome message when application language switches
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'msg-welcome') {
        return [getInitialWelcomeMessage(language)];
      }
      return prev;
    });

    // Cancel any active speech synthesis on language switch
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    }
    setSpeechError('');
  }, [language, getInitialWelcomeMessage]);

  // Quick Action Buttons tailored for Sportsperson
  const quickActions = isHindi ? [
    { label: 'क्या मैं अभी अभ्यास करूँ?', query: 'I want to train now instead. Is it okay?' },
    { label: 'इष्टतम प्रशिक्षण समय', query: 'What time is best for training today?' },
    { label: 'प्रशिक्षण में बारिश?', query: 'Will it rain during my training?' },
    { label: 'गर्मी और WBGT जोखिम', query: 'Should I carry extra water and what is the heat risk?' },
    { label: 'तड़ित / बिजली का खतरा', query: 'Is there any lightning risk today?' },
    { label: 'मैदान का मौसम', query: 'What is the ground and pitch condition?' },
    { label: 'दिनचर्या से तुलना', query: 'Compare with my routine' }
  ] : [
    { label: 'Train now?', query: 'I want to train now instead. Is it okay?' },
    { label: 'Best training time', query: 'What time is best for training today?' },
    { label: 'Rain during training?', query: 'Will it rain during my training?' },
    { label: 'Heat & WBGT risk', query: 'Should I carry extra water and what is the heat risk?' },
    { label: 'Lightning risk', query: 'Is there any lightning risk today?' },
    { label: 'Weather at my ground', query: 'What is the ground and pitch condition at my sports ground?' },
    { label: 'Compare with my routine', query: 'Compare with my routine' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Clean up SpeechSynthesis when modal closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    }
  }, [isOpen]);

  // Voice Input Setup using Web Speech API (STT)
  const handleToggleVoice = () => {
    setSpeechError('');

    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(t('chat_voice_unsupported') || 'Voice input is not supported on this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Set speech recognition language based on active application language
      recognition.lang = isHindi ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
        // Automatically send voice query
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(t('chat_voice_denied') || 'Microphone access denied. Please allow microphone permissions.');
        } else {
          setSpeechError(isHindi ? 'आवाज़ पहचानी नहीं जा सकी। कृपया पुनः प्रयास करें।' : 'Could not recognize speech. Please try again or type.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setSpeechError(t('chat_voice_unsupported') || 'Voice input is unavailable.');
    }
  };

  // Text-To-Speech (TTS) Voice Output with Language & Voice Verification
  const handleToggleReadAloud = (msgId, structured) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechError(isHindi ? 'इस ब्राउज़र में वॉइस आउटपुट उपलब्ध नहीं है।' : 'Voice output is not supported on this browser.');
      return;
    }

    if (playingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
      return;
    }

    setSpeechError('');
    window.speechSynthesis.cancel();

    // Verify if genuine Hindi voice is available when in Hindi mode
    const voiceCheck = getVoiceForLanguage(isHindi ? 'hi' : 'en', availableVoices);
    if (isHindi && !voiceCheck.available) {
      setSpeechError('इस डिवाइस या ब्राउज़र पर हिंदी आवाज़ उपलब्ध नहीं है।');
      setPlayingMessageId(null);
      return;
    }

    const speechText = [
      structured.answer,
      structured.why,
      structured.action
    ].filter(Boolean).join('. ');

    setPlayingMessageId(msgId);

    speakText({
      text: speechText,
      language: isHindi ? 'hi' : 'en',
      voices: availableVoices,
      onStart: () => {
        setPlayingMessageId(msgId);
      },
      onEnd: () => {
        setPlayingMessageId(null);
      },
      onError: (err) => {
        setPlayingMessageId(null);
        if (err && err.message) {
          setSpeechError(err.message);
        }
      }
    });
  };

  // Handle Query Submission Resiliently
  const handleSend = async (textToSend) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || isProcessing) return;

    // 1. Immediately clear input & speech errors
    setInputQuery('');
    setSpeechError('');

    // 2. Immediately append User Message to conversation UI
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: currentTime
    };

    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // 3. Build Chatbot Context safely
      const context = buildChatbotContext({
        user,
        language,
        selectedPersonas,
        currentLocation,
        currentTime,
        currentActivity,
        routine,
        savedLocations,
        weatherData,
        safetyInfo,
        isWeatherError
      });

      // 4. Generate Response safely
      const botResponse = await Promise.resolve(generateChatbotResponse(q, context));

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        structured: botResponse || {
          answer: isHindi ? 'मौसम डेटा विश्लेषण प्राप्त किया जा रहा है।' : 'Fetching weather intelligence metrics.',
          why: isHindi ? 'आपकी गतिविधि और स्थान के मौसम मापदंडों का विश्लेषण पूरा हुआ।' : 'Analyzed weather context for your query.',
          action: isHindi ? 'आप और प्रश्न पूछ सकते हैं।' : 'You may ask further questions.',
          disclaimer: isHindi ? 'MAUSAM सहायता प्रणाली।' : 'MAUSAM Assistant.'
        },
        timestamp: currentTime
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('[Chatbot Error] Message submission pipeline error:', error);
      const fallbackMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        structured: {
          answer: isHindi 
            ? 'क्षमा करें, मुझे इस समय जानकारी प्राप्त करने में अस्थायी समस्या हुई।' 
            : 'I encountered a temporary issue while fetching the requested weather insight.',
          why: isHindi 
            ? 'मौसम सेवा या संदर्भ विश्लेषण में एक क्षणिक रुकावट आई।' 
            : 'There was a momentary interruption in processing the weather context.',
          action: isHindi 
            ? 'कृपया पुनः प्रयास करें। आपका संदेश इतिहास सुरक्षित है।' 
            : 'Please try again in a moment. You can continue asking questions.',
          safety: null,
          metrics: null,
          ruleTriggered: 'CHATBOT_SUBMISSION_FALLBACK',
          disclaimer: isHindi ? 'MAUSAM सहायता प्रणाली।' : 'MAUSAM Assistant Protocol.'
        },
        timestamp: currentTime
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      // ALWAYS restore send button & loading state
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#F4F8FB] w-full max-w-md rounded-2xl shadow-2xl border border-slate-300/80 overflow-hidden flex flex-col h-[90vh] max-h-[750px] relative">
        
        {/* Top Header */}
        <div className="bg-[#1F5C8B] px-4 py-3 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D85A30] flex items-center justify-center shadow-xs border border-white/30">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight">{t('chat_header_title') || 'MAUSAM Assistant'}</h3>
                <span className="bg-[#D85A30]/90 text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-medium border border-white/20">
                  {isHindi ? 'खिलाड़ी मोड (हिन्दी)' : 'Sportsperson (EN)'}
                </span>
              </div>
              <p className="text-[10px] text-sky-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                {t('chat_system_status') || 'Official IMD Data Synchronized'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/90 transition-colors"
            title={t('chat_close') || 'Close Assistant'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Location & Context Ribbon */}
        <div className="bg-[#EAF3FA] px-3.5 py-1.5 border-b border-slate-200/80 flex items-center justify-between text-[11px] text-slate-700">
          <div className="flex items-center gap-1 truncate font-medium text-[#1F5C8B]">
            <MapPin className="w-3.5 h-3.5 text-[#D85A30] shrink-0" />
            <span className="truncate">{currentLocation?.name || 'Gaya Sports Ground'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-mono text-[10.5px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Chat Message Scrollable Viewport */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-[#F4F8FB] text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-[#1F5C8B] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Trophy className="w-3.5 h-3.5 text-[#D85A30]" />
                </div>
              )}

              <div className={`max-w-[90%] rounded-2xl p-3 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#1F5C8B] text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none space-y-2.5'
              }`}>
                {/* User Message Text */}
                {msg.text && (
                  <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                )}

                {/* Bot Structured Decision Card */}
                {msg.structured && (
                  <div className="space-y-2.5 text-xs">
                    {/* Safety Override Alert Banner if present */}
                    {msg.structured.safety && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2 shadow-2xs font-semibold">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <span className="block text-[11px] text-rose-800 uppercase tracking-wide">
                            {t('chat_safety_label') || 'Safety Override Alert'}
                          </span>
                          <p className="text-[11.5px] leading-snug mt-0.5">{msg.structured.safety}</p>
                        </div>
                      </div>
                    )}

                    {/* 1. Direct ANSWER Card */}
                    <div className="p-2.5 rounded-lg bg-sky-50/90 border border-sky-100 text-slate-900">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10.5px] text-[#1F5C8B] uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#1F5C8B]" />
                          {t('chat_answer_label') || 'Direct Answer'}
                        </span>
                        {/* Audio TTS Read Aloud Button */}
                        <button
                          onClick={() => handleToggleReadAloud(msg.id, msg.structured)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                            playingMessageId === msg.id 
                              ? 'bg-[#D85A30] text-white border-[#D85A30] animate-pulse' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-100/60'
                          }`}
                          title={playingMessageId === msg.id ? (t('chat_stop_speech') || 'Stop') : (t('chat_read_aloud') || 'Read Aloud')}
                        >
                          {playingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              <span>{t('chat_stop_speech') || 'Stop'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-[#1F5C8B]" />
                              <span>{isHindi ? 'सुनें (हिन्दी)' : (t('chat_read_aloud') || 'Read')}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-semibold text-slate-900 text-[12px] leading-snug">
                        {msg.structured.answer}
                      </p>
                    </div>

                    {/* 2. WHY (Contextual Rationale) */}
                    {msg.structured.why && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800">
                        <span className="font-semibold block text-[10.5px] text-slate-600 uppercase tracking-wide">
                          {t('chat_why_label') || 'Why (Contextual Reason)'}
                        </span>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-700">
                          {msg.structured.why}
                        </p>
                      </div>
                    )}

                    {/* 3. ACTION (Sportsperson Advice) */}
                    {msg.structured.action && (
                      <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 text-amber-950">
                        <span className="font-semibold block text-[10.5px] text-[#D85A30] uppercase tracking-wide">
                          {t('chat_action_label') || 'Actionable Advice'}
                        </span>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-800">
                          {msg.structured.action}
                        </p>
                      </div>
                    )}

                    {/* Metric Badges if available */}
                    {msg.structured.metrics && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="flex items-center gap-1.5 bg-[#F4F8FB] p-1.5 rounded border border-slate-200 text-[10.5px]">
                          <Flame className="w-3.5 h-3.5 text-[#D85A30]" />
                          <span className="text-slate-500">WBGT:</span>
                          <span className="font-semibold text-slate-800">{msg.structured.metrics.wbgt}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F4F8FB] p-1.5 rounded border border-slate-200 text-[10.5px]">
                          <Droplets className="w-3.5 h-3.5 text-sky-600" />
                          <span className="text-slate-500">Rain Prob:</span>
                          <span className="font-semibold text-slate-800">{msg.structured.metrics.rainProb}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F4F8FB] p-1.5 rounded border border-slate-200 text-[10.5px]">
                          <Wind className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-slate-500">Wind:</span>
                          <span className="font-semibold text-slate-800">{msg.structured.metrics.wind}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F4F8FB] p-1.5 rounded border border-slate-200 text-[10.5px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-slate-500">Turf:</span>
                          <span className="font-semibold text-slate-800 truncate">{msg.structured.metrics.groundCondition}</span>
                        </div>
                      </div>
                    )}

                    {/* Rule Trigger & Disclaimer */}
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <span>{msg.structured.disclaimer || t('chat_disclaimer_rule')}</span>
                      {msg.structured.ruleTriggered && (
                        <span className="text-[8.5px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          {msg.structured.ruleTriggered}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Voice listening pulse banner */}
          {isListening && (
            <div className="flex items-center gap-2 p-2.5 bg-sky-100 text-[#1F5C8B] rounded-xl border border-[#1F5C8B]/30 animate-pulse text-xs">
              <Mic className="w-4 h-4 text-[#D85A30] animate-bounce" />
              <span className="font-medium">
                {isHindi ? 'सुन रहा हूँ... अपना प्रश्न बोलें (हिन्दी)' : (t('chat_voice_listening') || 'Listening to your voice...')}
              </span>
            </div>
          )}

          {/* Speech error indicator */}
          {speechError && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Active processing loading indicator */}
          {isProcessing && (
            <div className="flex gap-2 justify-start items-center p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-slate-600 text-xs animate-pulse">
              <div className="w-5 h-5 rounded-full bg-[#1F5C8B] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-[#D85A30] animate-spin" />
              </div>
              <span className="font-medium text-[11.5px]">
                {isHindi ? 'MAUSAM विश्लेषण कर रहा है...' : 'MAUSAM is analyzing...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Suggested Questions Scrollable Row */}
        <div className="p-2 bg-white border-t border-slate-200 overflow-x-auto no-scrollbar scrollbar-hide flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-medium whitespace-nowrap pl-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D85A30]" />
          </span>
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qa.query)}
              disabled={isProcessing}
              className="px-2.5 py-1 bg-[#F4F8FB] hover:bg-sky-50 active:bg-sky-100 disabled:opacity-50 text-slate-700 hover:text-[#1F5C8B] border border-slate-200 rounded-full whitespace-nowrap transition-all shadow-2xs text-[11px] font-medium"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Bottom Input & Voice Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={isProcessing}
            className={`p-2 rounded-full border transition-all ${
              isListening
                ? 'bg-[#D85A30] text-white border-[#D85A30] animate-pulse ring-2 ring-rose-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
            title={isHindi ? 'आवाज़ से पूछें (हिन्दी)' : (t('chat_voice_btn') || 'Voice Input')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={isHindi ? 'प्रशिक्षण, बारिश, गर्मी, तड़ित या मैच समय के बारे में पूछें...' : (t('chat_input_placeholder') || 'Ask about training, rain, heat, lightning...')}
            className="flex-1 px-3 py-2 bg-[#F4F8FB] border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#1F5C8B] focus:border-[#1F5C8B] focus:outline-none focus:bg-white text-slate-900"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isProcessing}
            className="p-2 bg-[#1F5C8B] hover:bg-[#164467] disabled:opacity-40 text-white rounded-lg transition-all shadow-xs"
            title={t('chat_send') || 'Send Question'}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
