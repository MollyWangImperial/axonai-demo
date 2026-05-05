/**
 * PatientMessagesPage — AxonAI Patient Workspace
 * Design: Clean light shell — white card on #F7F8FA, teal accent
 * Sections: Message inbox · Thread view · Reply composer
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare, ChevronRight, ArrowLeft, Send,
  Sparkles, User, Bot, Home, Video, LogOut, Zap,
  CheckCircle2, AlertCircle, TrendingUp, Calendar,
} from "lucide-react";

const C = {
  bg:        "#F7F8FA",
  surface:   "#FFFFFF",
  border:    "#E4E7ED",
  text:      "#1A1D23",
  text2:     "#5A6070",
  text3:     "#9AA0AE",
  teal:      "#00B89A",
  tealDim:   "rgba(0,184,154,0.10)",
  tealBorder:"rgba(0,184,154,0.25)",
  amber:     "#F59E0B",
  amberDim:  "rgba(245,158,11,0.10)",
  blue:      "#3B82F6",
  blueDim:   "rgba(59,130,246,0.10)",
  purple:    "#8B5CF6",
  purpleDim: "rgba(139,92,246,0.10)",
  green:     "#10B981",
  greenDim:  "rgba(16,185,129,0.10)",
  red:       "#EF4444",
};

type MessageType = "ai_progress" | "therapist" | "ai_alert" | "ai_milestone" | "ai_plan_change";

interface Message {
  id: string;
  type: MessageType;
  from: string;
  fromRole: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  thread: ThreadMessage[];
}

interface ThreadMessage {
  id: string;
  from: string;
  fromRole: string;
  body: string;
  time: string;
  isPatient?: boolean;
  attachments?: { label: string; icon: string }[];
}

const MESSAGES: Message[] = [
  {
    id: "m1",
    type: "ai_progress",
    from: "AxonAI",
    fromRole: "AI Assistant",
    subject: "Great progress this week, James!",
    preview: "Your walking speed has improved by 8% since last assessment (0.82 → 0.89 m/s).",
    time: "Today, 8:00 AM",
    read: false,
    thread: [
      {
        id: "t1",
        from: "AxonAI",
        fromRole: "AI Assistant",
        time: "Today, 8:00 AM",
        body: "Hi James 👋\n\nYour Week 3 assessment results are in, and I'm pleased to share some great news:\n\n• Walking speed: 0.82 → 0.89 m/s (+8.5%)\n• Step symmetry: 68% → 74% (+6%)\n• Cadence: 94 → 98 steps/min (+4.3%)\n• Gait Score: 62 → 65 (+3 points)\n\nAll four key metrics have improved since your last assessment. You're on track to meet your Week 4 targets.\n\nKeep up the excellent work — your consistency is making a real difference. Dr. Erisa has been notified of your progress.",
        attachments: [
          { label: "View Full Report", icon: "📊" },
        ],
      },
    ],
  },
  {
    id: "m2",
    type: "therapist",
    from: "Dr. Erisa",
    fromRole: "Physiotherapist",
    subject: "Your plan has been updated",
    preview: "I've adjusted your hip flexor stretch to 3 sets × 45 seconds — your flexibility has improved.",
    time: "Yesterday, 3:15 PM",
    read: true,
    thread: [
      {
        id: "t1",
        from: "Dr. Erisa",
        fromRole: "Physiotherapist",
        time: "Yesterday, 3:15 PM",
        body: "Hi James,\n\nI've reviewed your latest assessment and I'm really pleased with your progress. Your hip flexibility has improved significantly, so I've made the following adjustments to your plan:\n\n• Hip Flexor Stretch: 3 sets × 30s → 3 sets × 45s hold\n• Seated Knee Raise: 2 sets × 15 reps → 2 sets × 20 reps\n• NEW: Standing Hip Abduction added (2 sets × 15 reps)\n\nThese changes will help you continue building strength and flexibility in preparation for Week 4.\n\nSee you at your next clinic appointment on Friday at 2:00 PM. Let me know if you have any questions!\n\nBest,\nDr. Erisa",
        attachments: [
          { label: "Updated Plan", icon: "📋" },
        ],
      },
      {
        id: "t2",
        from: "James Thornton",
        fromRole: "Patient",
        time: "Yesterday, 4:30 PM",
        isPatient: true,
        body: "Thank you Dr. Erisa! The new exercises feel challenging but manageable. I'll see you on Friday.",
      },
      {
        id: "t3",
        from: "Dr. Erisa",
        fromRole: "Physiotherapist",
        time: "Yesterday, 5:00 PM",
        body: "That's exactly what we want to hear! If anything feels too difficult or causes pain above a 5/10, please reduce the sets and let me know. See you Friday!",
      },
    ],
  },
  {
    id: "m3",
    type: "ai_milestone",
    from: "AxonAI",
    fromRole: "AI Assistant",
    subject: "Milestone reached: 4-day streak! 🔥",
    preview: "You've completed exercises 4 days in a row. You're in the top 20% of patients at your recovery stage.",
    time: "2 days ago",
    read: true,
    thread: [
      {
        id: "t1",
        from: "AxonAI",
        fromRole: "AI Assistant",
        time: "2 days ago",
        body: "Congratulations James! 🎉\n\nYou've completed your rehabilitation exercises 4 days in a row — a new personal best!\n\nHere's how you compare to other patients at the same stage of recovery:\n\n• Your compliance rate (78%) is in the top 20%\n• Your streak of 4 days is above the average of 2.8 days\n• Your gait improvement rate (+8.5% per assessment) is above average\n\nConsistency is the single most important factor in stroke rehabilitation outcomes. Keep it up — you're doing brilliantly.",
      },
    ],
  },
  {
    id: "m4",
    type: "ai_alert",
    from: "AxonAI",
    fromRole: "AI Assistant",
    subject: "Reminder: Weekly assessment due today",
    preview: "Your Week 3 gait assessment is due today. Please record a 30-second walk video.",
    time: "Today, 7:00 AM",
    read: false,
    thread: [
      {
        id: "t1",
        from: "AxonAI",
        fromRole: "AI Assistant",
        time: "Today, 7:00 AM",
        body: "Hi James,\n\nThis is a reminder that your Week 3 gait assessment is due today.\n\nRecording your assessment video takes only 2 minutes and helps your therapist:\n• Track your recovery progress objectively\n• Adjust your rehabilitation plan based on real data\n• Identify any issues early before they become problems\n\nPlease record your 30-second walk video at your earliest convenience today.",
        attachments: [
          { label: "Record Video Now", icon: "🎥" },
        ],
      },
    ],
  },
  {
    id: "m5",
    type: "ai_plan_change",
    from: "AxonAI",
    fromRole: "AI Assistant",
    subject: "Your rehabilitation plan has been updated",
    preview: "Based on your Week 2 assessment, your plan has been adjusted. 3 exercises modified, 1 new exercise added.",
    time: "1 week ago",
    read: true,
    thread: [
      {
        id: "t1",
        from: "AxonAI",
        fromRole: "AI Assistant",
        time: "1 week ago",
        body: "Hi James,\n\nBased on your Week 2 assessment results, your rehabilitation plan has been updated by Dr. Erisa:\n\nChanges made:\n• Hip Flexor Stretch: increased hold time (30s → 45s)\n• Supine Hip Flexion: increased reps (10 → 15)\n• Seated Knee Raise: increased sets (2 → 3)\n• NEW: Pelvic Tilts added to address lumbo-pelvic control\n\nThese changes reflect your improvement and are designed to continue challenging you appropriately.\n\nYour updated plan is now available in the Home tab.",
      },
    ],
  },
];

const TYPE_CONFIG: Record<MessageType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  ai_progress:    { icon: TrendingUp,    color: C.teal,   bg: C.tealDim,   label: "Progress Update" },
  therapist:      { icon: User,          color: C.blue,   bg: C.blueDim,   label: "Therapist" },
  ai_alert:       { icon: AlertCircle,   color: C.amber,  bg: C.amberDim,  label: "Reminder" },
  ai_milestone:   { icon: CheckCircle2,  color: C.green,  bg: C.greenDim,  label: "Milestone" },
  ai_plan_change: { icon: Calendar,      color: C.purple, bg: C.purpleDim, label: "Plan Update" },
};

function NavBar({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const unread = MESSAGES.filter(m => !m.read).length;
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
      style={{ backgroundColor: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.teal }}>
          <Zap size={14} color="#fff" />
        </div>
        <span className="font-bold text-sm" style={{ color: C.text }}>AxonAI</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-1" style={{ backgroundColor: C.tealDim, color: C.teal }}>Patient</span>
      </div>
      <nav className="flex items-center gap-1">
        {[
          { icon: Home, label: "Home", path: "/patient-home" },
          { icon: Video, label: "Upload", path: "/patient-upload" },
          { icon: MessageSquare, label: "Messages", path: "/patient-messages", badge: unread },
        ].map(({ icon: Icon, label, path, badge }) => (
          <button key={path} onClick={() => onNavigate(path)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-50"
            style={{ color: path === "/patient-messages" ? C.teal : C.text2 }}>
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
            {badge ? (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: C.red, fontSize: 9 }}>{badge}</span>
            ) : null}
          </button>
        ))}
        <button onClick={() => { logout(); navigate("/login"); }} className="p-2 rounded-lg hover:bg-gray-50 ml-1">
          <LogOut size={14} style={{ color: C.text3 }} />
        </button>
      </nav>
    </header>
  );
}

export default function PatientMessagesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState(MESSAGES);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "therapist">("all");

  const filtered = messages.filter(m => {
    if (filter === "unread") return !m.read;
    if (filter === "therapist") return m.type === "therapist";
    return true;
  });

  const openThread = (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    setActiveThread({ ...msg, read: true });
    setReply("");
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeThread) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    const newMsg: ThreadMessage = {
      id: `r${Date.now()}`,
      from: user?.name ?? "James Thornton",
      fromRole: "Patient",
      body: reply,
      time: "Just now",
      isPatient: true,
    };
    setActiveThread(prev => prev ? { ...prev, thread: [...prev.thread, newMsg] } : prev);
    setReply("");
    setSending(false);
  };

  const cfg = (type: MessageType) => TYPE_CONFIG[type];

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <NavBar onNavigate={navigate} />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* Thread view */}
        <AnimatePresence mode="wait">
          {activeThread ? (
            <motion.div
              key="thread"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Thread header */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setActiveThread(null)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: C.text3 }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold truncate" style={{ color: C.text }}>{activeThread.subject}</h1>
                  <p className="text-xs" style={{ color: C.text3 }}>
                    {cfg(activeThread.type).label} · {activeThread.time}
                  </p>
                </div>
              </div>

              {/* Thread messages */}
              <div className="space-y-4 mb-4">
                {activeThread.thread.map((msg, idx) => {
                  const isPatient = msg.isPatient;
                  const config = cfg(activeThread.type);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex gap-3 ${isPatient ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: isPatient ? C.tealDim : config.bg,
                          color: isPatient ? C.teal : config.color,
                        }}
                      >
                        {isPatient ? (user?.name?.[0] ?? "J") : (activeThread.type === "therapist" ? "E" : "AI")}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-xs sm:max-w-sm ${isPatient ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: C.text }}>{msg.from}</span>
                          <span className="text-xs" style={{ color: C.text3 }}>{msg.time}</span>
                        </div>
                        <div
                          className="rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line"
                          style={{
                            backgroundColor: isPatient ? C.teal : C.surface,
                            color: isPatient ? "#fff" : C.text2,
                            border: isPatient ? "none" : `1.5px solid ${C.border}`,
                            borderTopLeftRadius: !isPatient ? 4 : undefined,
                            borderTopRightRadius: isPatient ? 4 : undefined,
                          }}
                        >
                          {msg.body}
                        </div>
                        {msg.attachments && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {msg.attachments.map(att => (
                              <button
                                key={att.label}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                                style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}30` }}
                              >
                                <span>{att.icon}</span> {att.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply composer — only for therapist threads */}
              {activeThread.type === "therapist" && (
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
                >
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Reply to Dr. Erisa…"
                    rows={3}
                    className="w-full text-sm rounded-xl px-3 py-2.5 resize-none outline-none"
                    style={{ backgroundColor: "#F7F8FA", border: `1.5px solid ${C.border}`, color: C.text }}
                    onKeyDown={e => { if (e.key === "Enter" && e.metaKey) sendReply(); }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs" style={{ color: C.text3 }}>⌘ + Enter to send</p>
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim() || sending}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ backgroundColor: C.teal, color: "#fff" }}
                    >
                      {sending ? "Sending…" : <><Send size={12} /> Send</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (

            /* Inbox view */
            <motion.div
              key="inbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold" style={{ color: C.text }}>Messages</h1>
                  <p className="text-sm mt-0.5" style={{ color: C.text2 }}>
                    {messages.filter(m => !m.read).length} unread
                  </p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mb-4">
                {(["all", "unread", "therapist"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      backgroundColor: filter === f ? C.teal : "#F7F8FA",
                      color: filter === f ? "#fff" : C.text2,
                      border: `1.5px solid ${filter === f ? C.teal : C.border}`,
                    }}
                  >
                    {f === "all" ? "All" : f === "unread" ? `Unread (${messages.filter(m => !m.read).length})` : "From Therapist"}
                  </button>
                ))}
              </div>

              {/* Message list */}
              <div className="space-y-2">
                {filtered.map((msg, idx) => {
                  const config = cfg(msg.type);
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => openThread(msg)}
                      className="w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: C.surface,
                        border: `1.5px solid ${!msg.read ? config.color + "40" : C.border}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon size={16} style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold truncate" style={{ color: config.color }}>
                            {msg.from}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: config.bg, color: config.color }}
                          >
                            {config.label}
                          </span>
                          {!msg.read && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                          )}
                        </div>
                        <p
                          className="text-sm truncate"
                          style={{ color: C.text, fontWeight: msg.read ? 400 : 600 }}
                        >
                          {msg.subject}
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: C.text3 }}>
                          {msg.preview}
                        </p>
                        <p className="text-xs mt-1" style={{ color: C.text3 }}>{msg.time}</p>
                      </div>
                      <ChevronRight size={14} style={{ color: C.text3 }} className="flex-shrink-0 mt-1" />
                    </motion.button>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare size={32} style={{ color: C.text3 }} className="mx-auto mb-3" />
                  <p className="text-sm font-semibold" style={{ color: C.text2 }}>No messages</p>
                  <p className="text-xs mt-1" style={{ color: C.text3 }}>
                    {filter === "unread" ? "You're all caught up!" : "Messages from your therapist and AxonAI will appear here."}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-8" />
      </main>
    </div>
  );
}
