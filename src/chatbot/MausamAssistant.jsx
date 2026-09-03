import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Bot, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Clock,
  MapPin
} from 'lucide-react';
import { generateChatbotResponse } from './chatbotEngine';
import { buildChatbotContext } from './chatbotContext';
import { useI18n } from '../i18n/i18nContext';

export default function MausamAssistant({
  isOpen,
  onClose,
  user,
  selectedPersonas = ['daily_life'],
  currentLocation = {},
  currentTime = '06:30',
  currentActivity = null,
  routine = [],
  savedLocations = [],
  weatherData = {},
  safetyInfo = {}
}) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: isHindi 
        ? 'सुप्रभात! मैं आपका MAUSAM सहायक हूँ। आप मौसम, अपनी दिनचर्या, यात्रा या गतिविधियों के बारे में कोई भी प्रश्न पूछ सकते हैं।'
        : 'Hello! I am your MAUSAM Assistant. Ask me about the forecast, routine timing, travel, or activity planning.',
      timestamp: currentTime
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Suggested Questions
  const suggestedQuestions = isHindi ? [
    'क्या मैं अभी दौड़ने जा सकता हूँ?',
    'मेरी शाम 4:30 बजे की यात्रा में बारिश होगी क्या?',
    'मुझे आज शाम 6:15 बजे निकलना है, मौसम कैसा रहेगा?',
    'क्या कल सुबह खेत में छिड़काव करना ठीक रहेगा?',
    'आज रात मेरे मुंबई वाले स्थान पर मौसम कैसा है?'
  ] : [
    'Can I go for a run now?',
    'Will it rain during my 4:30 PM commute?',
    'I need to leave office at 6:15 PM today. What will the weather be like?',
    'Is tomorrow morning good for farm spraying?',
    "What's the weather at my Mumbai location tonight?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Voice Input Setup using Web Speech API
  const handleToggleVoice = () => {
    setSpeechError('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(t('chat_voice_unsupported'));
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
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(t('chat_voice_denied'));
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
      setSpeechError(t('chat_voice_unsupported'));
    }
  };

  const handleSend = (textToSend) => {
    const q = (textToSend || inputQuery).trim();
    if (!q) return;

    // Add User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: currentTime
    };

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
      safetyInfo
    });

    const botResponse = generateChatbotResponse(q, context);

    const botMsg = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      structured: botResponse,
      timestamp: currentTime
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInputQuery('');
    setSpeechError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[750px]">
        {/* Header */}
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-medium">{t('chat_header_title')}</h3>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full border border-emerald-400/30">
                  AI Context Active
                </span>
              </div>
              <p className="text-[10.5px] text-sky-200">{t('chat_header_subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/90 transition-colors"
            title={t('chat_close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F4F8FB] text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-brand text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}>
                {msg.text && (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}

                {msg.structured && (
                  <div className="space-y-2 text-xs">
                    {/* Weather line */}
                    <div className="p-2 rounded-lg bg-sky-50/80 border border-sky-100 text-sky-950">
                      <span className="font-semibold block text-[11px] text-brand">
                        {t('chat_weather_label')}
                      </span>
                      <p className="mt-0.5">{msg.structured.weather}</p>
                    </div>

                    {/* Impact line */}
                    {msg.structured.impact && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-100 text-amber-950">
                        <span className="font-semibold block text-[11px] text-amber-800">
                          {t('chat_impact_label')}
                        </span>
                        <p className="mt-0.5">{msg.structured.impact}</p>
                      </div>
                    )}

                    {/* Recommendation line */}
                    {msg.structured.recommendation && (
                      <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-100 text-emerald-950">
                        <span className="font-semibold block text-[11px] text-emerald-800">
                          {t('chat_rec_label')}
                        </span>
                        <p className="mt-0.5">{msg.structured.recommendation}</p>
                      </div>
                    )}

                    {/* Safety Alert if any */}
                    {msg.structured.safety && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-1.5 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{msg.structured.safety}</span>
                      </div>
                    )}

                    {/* Disclaimer tag */}
                    <span className="text-[9.5px] text-slate-400 block pt-0.5 font-mono">
                      {msg.structured.disclaimer || t('chat_mock_disclaimer')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Voice listening status */}
          {isListening && (
            <div className="flex items-center gap-2 p-2.5 bg-sky-100 text-brand rounded-xl border border-brand/30 animate-pulse text-xs">
              <Mic className="w-4 h-4 animate-bounce" />
              <span>{t('chat_voice_listening')}</span>
            </div>
          )}

          {speechError && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg">
              {speechError}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Pills */}
        <div className="p-2 bg-slate-50 border-t border-slate-200/80 overflow-x-auto no-scrollbar scrollbar-hide flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-medium whitespace-nowrap pl-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
          </span>
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 active:bg-sky-100 text-slate-700 hover:text-brand border border-slate-200 rounded-full whitespace-nowrap transition-colors shadow-2xs text-[11px]"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2 rounded-full border transition-all ${
              isListening
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse ring-2 ring-rose-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
            title={t('chat_voice_btn')}
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
            placeholder={t('chat_input_placeholder')}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none focus:bg-white"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuery.trim()}
            className="p-2 bg-brand hover:bg-brand-dark disabled:opacity-40 text-white rounded-mausam transition-all shadow-2xs"
            title={t('chat_send')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
