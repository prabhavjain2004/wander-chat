"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MapPin, 
  Palmtree, 
  Compass, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Users,
  Briefcase,
  Gem,
  Loader2,
  Sparkles,
  Plane,
  Heart,
  Globe,
  Wind
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// ── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  style: string;
  group: string;
  interests: string[];
  dates: string;
  destination: string;
  hidden_gems: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Components ───────────────────────────────────────────────────────────────

const Navbar = ({ onReset }: { onReset: () => void }) => (
  <motion.nav 
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="flex shrink-0 items-center justify-between px-6 py-4 w-full"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Palmtree className="text-slate-950 w-6 h-6" />
      </div>
      <div>
        <span className="font-serif text-xl tracking-tight text-white">Wanderchat</span>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[8px] text-emerald-400 uppercase tracking-[0.3em]">Intelligence v2.3</span>
        </div>
      </div>
    </div>
    
    <button 
      onClick={onReset}
      className="p-3 rounded-xl glass hover:bg-white/5 transition-all text-slate-400 hover:text-white"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  </motion.nav>
);

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Wanderchat() {
  const [onboardStep, setOnboardStep] = useState(0); 
  const [profile, setProfile] = useState<UserProfile>({
    style: "Balanced",
    group: "Family",
    interests: [],
    dates: "",
    destination: "Explore Kerala",
    hidden_gems: false,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg,
          profile: {
            ...profile,
            interests: profile.interests.join(", "),
          },
          history: messages.slice(-10)
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response || "Synthesis failed." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Cognitive link offline." }]);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setOnboardStep(prev => prev + 1);
  const prevStep = () => setOnboardStep(prev => prev - 1);
  const finishOnboarding = () => setOnboardStep(100);

  // ── Render Steps ───────────────────────────────────────────────────────────

  const StepWrapper = ({ title, subtitle, icon: Icon, children, isLast = false, onNext = nextStep }: any) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-2xl w-full flex flex-col items-center"
    >
      <div className="mb-12 text-center">
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="inline-flex p-4 rounded-[2rem] glass mb-6 border-emerald-500/20"
        >
          <Icon className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-5xl font-serif heading-premium mb-4">{title}</h2>
        <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">{subtitle}</p>
      </div>

      <div className="w-full mb-12">{children}</div>

      <div className="flex gap-4 w-full max-w-sm">
        {onboardStep > 1 && (
          <button onClick={prevStep} className="flex-1 py-5 rounded-3xl glass text-slate-400 font-bold flex items-center justify-center hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={isLast ? finishOnboarding : onNext}
          className="btn-futuristic flex-1 relative z-50"
        >
          {isLast ? "Begin Vision" : "Continue"}
        </button>
      </div>
    </motion.div>
  );

  // ── ONBOARDING UI ──────────────────────────────────────────────────────────

  if (onboardStep < 100) {
    return (
      <div className="mesh-bg flex items-center justify-center p-10 min-h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {onboardStep === 0 && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="relative z-10 text-center flex flex-col items-center"
            >
              <div className="mb-10 relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-10 border border-emerald-500/10 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-20 border border-emerald-500/5 rounded-full"
                />
                <Palmtree className="w-32 h-32 text-emerald-400 relative drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
              </div>
              
              <h1 className="text-8xl font-serif heading-premium mb-6 tracking-tighter">
                Wander<span className="text-emerald-400">chat</span>
              </h1>
              <p className="text-slate-500 text-lg font-light tracking-[0.3em] mb-12 max-w-md uppercase">
                INTELLIGENT TRAVEL REIMAGINED
              </p>

              <button 
                onClick={nextStep}
                className="btn-futuristic relative z-50"
              >
                Start Your Vision
              </button>
            </motion.div>
          )}

          {onboardStep === 1 && (
            <StepWrapper title="Direction" subtitle="Select your primary intent" icon={MapPin} key="s1">
              <div className="space-y-4">
                {[
                  { id: "place", label: "I have a specific destination", sub: "Munnar, Kochi, Varkala...", icon: Compass },
                  { id: "explore", label: "Help me explore Kerala", sub: "Discover the perfect vibe", icon: Globe }
                ].map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => setProfile({...profile, destination: opt.id === "explore" ? "Explore Kerala" : ""})}
                    className={`option-card ${((opt.id === "explore" && profile.destination === "Explore Kerala") || (opt.id === "place" && profile.destination !== "Explore Kerala")) ? 'selected' : ''}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${((opt.id === "explore" && profile.destination === "Explore Kerala") || (opt.id === "place" && profile.destination !== "Explore Kerala")) ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-500'}`}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{opt.label}</div>
                        <div className="text-sm text-slate-500">{opt.sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {profile.destination !== "Explore Kerala" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <input 
                      autoFocus
                      className="w-full p-6 rounded-3xl bg-white/5 border border-emerald-500/20 focus:border-emerald-500 outline-none text-white text-xl placeholder:text-slate-700"
                      placeholder="Destination Name..."
                      value={profile.destination}
                      onChange={(e) => setProfile({...profile, destination: e.target.value})}
                    />
                  </motion.div>
                )}
              </div>
            </StepWrapper>
          )}

          {onboardStep === 2 && (
            <StepWrapper title="Atmosphere" subtitle="Choose your travel vibration" icon={Wind} key="s2">
              <div className="grid grid-cols-2 gap-4">
                {["Luxury", "Balanced", "Budget", "Adventure", "Backpacker", "Workation"].map(s => (
                  <div 
                    key={s}
                    onClick={() => setProfile({...profile, style: s})}
                    className={`option-card text-center ${profile.style === s ? 'selected' : ''}`}
                  >
                    <div className="font-bold text-lg">{s}</div>
                  </div>
                ))}
              </div>
            </StepWrapper>
          )}

          {onboardStep === 3 && (
            <StepWrapper title="Companions" subtitle="Who are you traveling with?" icon={Users} key="s3">
              <div className="grid grid-cols-2 gap-4">
                {["Solo", "Couple", "Family", "Friends", "Student"].map(g => (
                  <div 
                    key={g}
                    onClick={() => setProfile({...profile, group: g})}
                    className={`option-card text-center ${profile.group === g ? 'selected' : ''}`}
                  >
                    <div className="font-bold text-lg">{g}</div>
                  </div>
                ))}
              </div>
            </StepWrapper>
          )}

          {onboardStep === 4 && (
            <StepWrapper title="Passions" subtitle="What ignites your journey?" icon={Heart} key="s4">
              <div className="flex flex-wrap justify-center gap-3">
                {["Nature", "Food", "History", "Beaches", "Ayurveda", "Shopping", "Houseboats", "Tea Estates"].map(i => (
                  <div 
                    key={i}
                    onClick={() => {
                      const newInts = profile.interests.includes(i) ? profile.interests.filter(x => x !== i) : [...profile.interests, i];
                      setProfile({...profile, interests: newInts});
                    }}
                    className={`px-8 py-4 rounded-full border transition-all cursor-pointer font-bold text-sm ${profile.interests.includes(i) ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/20 hover:bg-white/10'}`}
                  >
                    {i}
                  </div>
                ))}
              </div>
            </StepWrapper>
          )}

          {onboardStep === 5 && (
            <StepWrapper title="Timeline" subtitle="Approx travel window" icon={Calendar} isLast key="s5">
              <div className="space-y-6">
                <input 
                  autoFocus
                  className="w-full p-8 rounded-[2.5rem] bg-white/5 border border-emerald-500/20 focus:border-emerald-500 outline-none text-white text-center text-4xl font-serif"
                  placeholder="Dec 24-30"
                  value={profile.dates}
                  onChange={(e) => setProfile({...profile, dates: e.target.value})}
                />
                <p className="text-center text-slate-600 text-xs uppercase tracking-widest">Optional but recommended</p>
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── MAIN CHAT INTERFACE ────────────────────────────────────────────────────

  return (
    <div className="mesh-bg flex flex-col h-screen p-4 overflow-hidden">
      <Navbar onReset={() => setOnboardStep(0)} />
      
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">


      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 glass rounded-[2.5rem] flex flex-col p-8 shadow-2xl relative shrink-0"
      >
        <div className="absolute top-8 right-8 z-20">
          <Sparkles className="w-4 h-4 text-emerald-400/50" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-10 pr-2 custom-scrollbar min-h-0">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Profile</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                <Plane className="w-5 h-5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">Goal</span>
                  <span className="text-sm font-bold text-white">{profile.destination}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                <Users className="w-5 h-5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">Group</span>
                  <span className="text-sm font-bold text-white">{profile.group}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Gem className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold">Hidden Gems</span>
              </div>
              <button 
                onClick={() => setProfile({...profile, hidden_gems: !profile.hidden_gems})}
                className={`w-12 h-6 rounded-full transition-all relative ${profile.hidden_gems ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.hidden_gems ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-wider">
              Enabling this mode directs the intelligence to prioritize offbeat, non-mainstream locations.
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-[2rem] bg-slate-900/40 border border-white/5 text-center shrink-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</div>
          <div className="text-emerald-400 text-sm font-bold flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            Vocal for Local Active
          </div>
        </div>
      </motion.div>

      <div className="flex-1 glass rounded-[2.5rem] flex flex-col relative overflow-hidden shadow-2xl min-w-0 min-h-0">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#020617]/80 to-transparent z-10 pointer-events-none" />
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 md:px-16 py-12 space-y-12 min-h-0">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8">
              <div className="w-20 h-20 rounded-[2.5rem] glass flex items-center justify-center border-emerald-500/20">
                <Sparkles className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-4xl font-serif text-white mb-4 italic">Namaskaram.</h2>
                <p className="text-slate-500 leading-relaxed">
                  Your personalized intelligence layer for Kerala is active. Ask about specific spots, historical context, or start building your vision.
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'p-6 px-10 rounded-[2.5rem] bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20' : 'glass-card p-10 rounded-[3rem]'}`}>
                {msg.role === 'assistant' ? (
                  <div className="prose">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="text-xl tracking-tight">{msg.content}</span>
                )}
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="glass-card px-10 py-6 rounded-[2.5rem] flex items-center gap-4">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(j => (
                    <motion.div key={j} animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }} className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Synthesizing Vision</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Command Bar */}
        <div className="p-8 pt-0 shrink-0">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-30 transition-all duration-1000" />
            <input 
              type="text" 
              placeholder="Ask anything about Kerala..."
              className="w-full bg-[#0a0f1e]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 pr-28 text-white text-xl placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-all relative shadow-2xl"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-4 top-4 bottom-4 px-10 rounded-3xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
          <div className="text-center mt-6">
             <span className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.5em]">Integrated Intelligence Layer // God's Own Country</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
