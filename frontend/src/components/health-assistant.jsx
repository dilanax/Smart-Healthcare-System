import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'healthcare_chatbot_messages';

const QUICK_ACTIONS = [
  { id: 'book', label: 'Book appointment', prompt: 'I want to book an appointment.' },
  { id: 'profile', label: 'Profile help', prompt: 'Help me update my profile.' },
  { id: 'prescriptions', label: 'Prescriptions', prompt: 'Where can I find my prescriptions?' },
  { id: 'video', label: 'Video call', prompt: 'How do I join a video consultation?' },
];

const createBotMessage = (text, extras = {}) => ({
  id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'bot',
  text,
  createdAt: Date.now(),
  ...extras,
});

const createUserMessage = (text) => ({
  id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'user',
  text,
  createdAt: Date.now(),
});

const getWelcomeMessage = (currentUser) => {
  const name = currentUser?.firstName || currentUser?.name || 'there';
  return createBotMessage(
    `Hi ${name}. I’m your Health Assistant. I can help with appointments, profile updates, prescriptions, payments, and video consultation guidance. I can give site help and general wellness guidance, but I’m not a substitute for emergency care or a doctor’s diagnosis.`
  );
};

const getPathSuggestions = (path, currentUser) => {
  if (path === '/profile') {
    return [
      'You are on your profile page. I can help you update your details, explain appointment statuses, or guide you to prescriptions.',
    ];
  }

  if (path === '/appointment') {
    return [
      'You are on appointment booking. I can help you choose a doctor, fill patient details, or explain the booking flow.',
    ];
  }

  if (path === '/payment') {
    return [
      'You are on payment. I can help explain what details you should review before confirming your booking.',
    ];
  }

  if (!currentUser) {
    return [
      'You are browsing as a guest. I can guide you to registration, login, and appointment booking.',
    ];
  }

  return [
    'Ask me anything about using this healthcare portal.',
  ];
};

const inferReply = (message, navigate, currentUser) => {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return createBotMessage('Send me a question or tap one of the quick actions below.');
  }

  if (/(emergency|chest pain|can\'t breathe|bleeding|stroke|heart attack|suicide)/.test(normalized)) {
    return createBotMessage(
      'This sounds urgent. Please contact your local emergency services immediately or go to the nearest emergency department. For severe chest pain, trouble breathing, heavy bleeding, stroke symptoms, or self-harm risk, do not wait for online help.'
    );
  }

  if (/(book|appointment|consultation|doctor)/.test(normalized)) {
    return createBotMessage(
      'You can book a consultation from the appointment page. Choose a doctor, select date and time, complete patient details, and then continue to payment if required.',
      {
        ctaLabel: 'Open Appointment Page',
        onAction: () => navigate('/appointment'),
      }
    );
  }

  if (/(profile|edit profile|update profile|phone|age|gender|name)/.test(normalized)) {
    return createBotMessage(
      'You can update your personal details from the profile page. Open the profile, choose "Edit Profile Details", update your information, and save changes.',
      {
        ctaLabel: 'Open Profile',
        onAction: () => navigate('/profile'),
      }
    );
  }

  if (/(prescription|medicine|medication|rx)/.test(normalized)) {
    return createBotMessage(
      'Your prescriptions appear in the Profile page under the Prescriptions tab after a doctor records them. If nothing appears yet, your doctor may not have uploaded one.'
    );
  }

  if (/(video|call|telemedicine|jitsi|join)/.test(normalized)) {
    return createBotMessage(
      'Video consultation becomes available when your appointment is confirmed. Open your Profile page, go to Appointments, and use the "Join Video Call" button when it is active.'
    );
  }

  if (/(login|register|otp|sign in|sign up)/.test(normalized)) {
    return createBotMessage(
      currentUser
        ? 'You are already signed in. If you want to change your account details, I can guide you through the profile page.'
        : 'You can create an account from Register, then log in. If OTP verification is required, the site will send a code to your email.'
    );
  }

  if (/(payment|pay|fee|invoice)/.test(normalized)) {
    return createBotMessage(
      'After booking, the payment page shows the consultation details and amount. Review the doctor, date, time, and fee before confirming.'
    );
  }

  if (/(hello|hi|hey)/.test(normalized)) {
    return createBotMessage('Hi. I can help with appointments, profile updates, prescriptions, payments, and video consultation guidance.');
  }

  return createBotMessage(
    'I can help best with site-related tasks like appointments, profile updates, prescriptions, payments, and video calls. If you want medical advice for symptoms, I can offer only general guidance and safety reminders.'
  );
};

const AssistantIcon = ({ open = false }) => (
  <svg className={`h-6 w-6 transition-transform ${open ? 'rotate-6' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3a6 6 0 0 0-6 6v1.5A2.5 2.5 0 0 1 4.5 13 2.5 2.5 0 0 0 6 15.5V16a6 6 0 0 0 12 0v-.5A2.5 2.5 0 0 0 19.5 13 2.5 2.5 0 0 1 18 10.5V9a6 6 0 0 0-6-6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.5 11.5h.01M14.5 11.5h.01M9 15c.8.6 1.8 1 3 1s2.2-.4 3-1" />
  </svg>
);

const HealthAssistant = ({ navigate, currentUser, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) && saved.length > 0 ? saved : [getWelcomeMessage(currentUser)];
    } catch {
      return [getWelcomeMessage(currentUser)];
    }
  });
  const panelRef = useRef(null);
  const listRef = useRef(null);

  const helperTips = useMemo(() => getPathSuggestions(currentPath, currentUser), [currentPath, currentUser]);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        messages.map((item) => ({
          id: item.id,
          role: item.role,
          text: item.text,
          createdAt: item.createdAt,
          ctaLabel: item.ctaLabel || null,
        }))
      )
    );
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const pushMessage = (entry) => {
    setMessages((previous) => [...previous, entry]);
  };

  const handlePrompt = (prompt) => {
    const userMessage = createUserMessage(prompt);
    pushMessage(userMessage);
    window.setTimeout(() => {
      pushMessage(inferReply(prompt, navigate, currentUser));
    }, 180);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    handlePrompt(trimmed);
  };

  const resetConversation = () => {
    const welcome = getWelcomeMessage(currentUser);
    setMessages([welcome]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]" ref={panelRef}>
      {isOpen ? (
        <div className="mb-4 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-teal-100 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-600 px-5 py-5 text-white">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">Smart Healthcare</p>
                <h3 className="mt-1 text-xl font-black">Health Assistant</h3>
                <p className="mt-2 text-sm leading-6 text-cyan-50">
                  Fast help for appointments, profile updates, prescriptions, and video consultations.
                </p>
              </div>
              <button
                type="button"
                onClick={resetConversation}
                className="rounded-xl bg-white/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition hover:bg-white/25"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-xs font-semibold leading-5 text-slate-600">
              {helperTips[0]}
            </p>
          </div>

          <div ref={listRef} className="max-h-[380px] space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'border border-teal-100 bg-white text-slate-700'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.role === 'bot' && message.ctaLabel ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof message.onAction === 'function') message.onAction();
                      }}
                      className="mt-3 rounded-xl bg-teal-600 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-teal-700"
                    >
                      {message.ctaLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handlePrompt(action.prompt)}
                  className="rounded-full border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100"
                >
                  {action.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about appointments, profile updates, prescriptions, or video calls..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white"
              />
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800"
              >
                Send
              </button>
            </form>

            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              For emergencies, contact local emergency services immediately. This assistant provides portal help and general guidance only.
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 px-4 py-3 text-white shadow-[0_18px_40px_-18px_rgba(8,145,178,0.8)] transition hover:scale-[1.02] hover:shadow-[0_22px_45px_-18px_rgba(8,145,178,0.9)]"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 backdrop-blur-sm">
          <AssistantIcon open={isOpen} />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">AI Support</p>
          <p className="text-sm font-bold">Health Assistant</p>
        </div>
      </button>
    </div>
  );
};

export default HealthAssistant;
