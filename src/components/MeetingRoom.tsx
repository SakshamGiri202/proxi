import React, { useState, useEffect, useRef } from 'react';
import type { Project, Meeting } from '@/types';
import { generateBriefingScript, generateStakeholderResponse } from '@/lib/briefingGenerator';
import { BolnaCallModal } from './BolnaCallModal';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  PhoneCall,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  MessageSquare,
  CheckCircle2,
  ListTodo,
  Copy,
  Check,
  Play,
  Users,
} from 'lucide-react';

interface MeetingRoomProps {
  project: Project;
  meeting: Meeting;
  onExit: () => void;
  onUpdateMeeting?: (updated: Meeting) => void;
}

interface TranscriptEntry {
  speaker: string;
  role: string;
  text: string;
  time: string;
  isAi?: boolean;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  project,
  meeting,
  onExit,
  onUpdateMeeting,
}) => {
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [activeSideTab, setActiveSideTab] = useState<'transcript' | 'qa' | 'notes'>('transcript');
  const [customQuestion, setCustomQuestion] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(48);
  const [showBolnaCall, setShowBolnaCall] = useState(false);

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      speaker: 'Sarah Jenkins',
      role: 'VP Digital, Client',
      text: 'Thanks for having Proxi join. We have our engineering and product leads in the room.',
      time: '10:00 AM',
      isAi: false,
    },
    {
      speaker: 'Alex Chen',
      role: 'Tech Lead',
      text: 'Looking forward to the update on sprint 4 progress and the design tokens.',
      time: '10:01 AM',
      isAi: false,
    },
  ]);

  const [decisions, setDecisions] = useState<string[]>(
    meeting.decisions && meeting.decisions.length > 0
      ? [...meeting.decisions]
      : ['Design tokens approved for staging environment', 'Security audit aligned for Thursday']
  );

  const [actionItems, setActionItems] = useState<string[]>(
    meeting.action_items && meeting.action_items.length > 0
      ? [...meeting.action_items]
      : ['Send Twilio pricing breakdown to client PM', 'Sync staging build commits by 5 PM']
  );

  const [newNoteInput, setNewNoteInput] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Meeting timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(secs: number) {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }

  // Voice speech synthesis with best-quality voice selection
  function speakText(text: string, onEnd?: () => void) {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(true);
      setCurrentSubtitle(text);
      const fakeDuration = Math.min(Math.max(text.length * 50, 2500), 7000);
      setTimeout(() => {
        setIsSpeaking(false);
        setCurrentSubtitle('');
        if (onEnd) onEnd();
      }, fakeDuration);
      return;
    }

    window.speechSynthesis.cancel();

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);

      // Priority: Google/Microsoft natural English voices, then any en-US, then any en
      const preferredVoice =
        voices.find((v) => v.lang === 'en-US' && v.name.includes('Google US English')) ||
        voices.find((v) => v.lang === 'en-US' && v.name.toLowerCase().includes('natural')) ||
        voices.find((v) => v.lang === 'en-US' && v.name.includes('Microsoft')) ||
        voices.find((v) => v.lang === 'en-US' && v.name.includes('Samantha')) ||
        voices.find((v) => v.lang === 'en-US' && !v.localService) ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.92;   // Slightly slower — clearer for briefings
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      setIsSpeaking(true);
      setCurrentSubtitle(text);

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentSubtitle('');
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentSubtitle('');
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet — wait for them
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    }
  }

  // Real microphone toggle
  async function handleToggleMic() {
    if (micActive) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicActive(true);
      } catch {
        alert('Microphone permission denied. Please allow mic access in your browser settings and try again.');
      }
    }
  }

  // Real camera toggle
  async function handleToggleCamera() {
    if (cameraActive) {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        camStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch {
        alert('Camera permission denied. Please allow camera access in your browser settings.');
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Deliver the main briefing
  function handleDeliverBriefing() {
    const briefingText = meeting.briefing || generateBriefingScript(project, meeting);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTranscript((prev) => [
      ...prev,
      {
        speaker: 'Proxi AI',
        role: 'Project Representative',
        text: briefingText,
        time: timeStr,
        isAi: true,
      },
    ]);

    speakText(briefingText);
  }

  // Handle a stakeholder question
  function handleAskQuestion(questionText: string, asker: string = 'Sarah Jenkins', askerRole: string = 'VP Digital') {
    if (!questionText.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add question to transcript
    setTranscript((prev) => [
      ...prev,
      {
        speaker: asker,
        role: askerRole,
        text: questionText,
        time: timeStr,
        isAi: false,
      },
    ]);

    // 2. Generate Proxi response
    const answer = generateStakeholderResponse(questionText, project);

    setTimeout(() => {
      const answerTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTranscript((prev) => [
        ...prev,
        {
          speaker: 'Proxi AI',
          role: 'Project Representative',
          text: answer,
          time: answerTime,
          isAi: true,
        },
      ]);
      speakText(answer);
    }, 600);
  }

  function handleCustomQuestionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    handleAskQuestion(customQuestion, 'You', 'Meeting Host');
    setCustomQuestion('');
  }

  function handleAddDecision() {
    if (!newNoteInput.trim()) return;
    setDecisions((prev) => [...prev, newNoteInput.trim()]);
    setNewNoteInput('');
  }

  function handleAddActionItem() {
    if (!newNoteInput.trim()) return;
    setActionItems((prev) => [...prev, newNoteInput.trim()]);
    setNewNoteInput('');
  }

  function handleEndCall() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (onUpdateMeeting) {
      onUpdateMeeting({
        ...meeting,
        status: 'Completed',
        decisions,
        action_items: actionItems,
      });
    }
    onExit();
  }

  function handleCopyMeetLink() {
    if (meeting.meet_url) {
      navigator.clipboard.writeText(meeting.meet_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="meeting-room-container">
      {/* Top Meeting Header */}
      <header className="meeting-room-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleEndCall} title="Return to Dashboard">
            ← Exit Room
          </button>
          <div className="meeting-meta">
            <span className="live-pill">
              <span className="pulse-dot" /> LIVE BRIEFING
            </span>
            <h2>{meeting.title}</h2>
            <span className="project-tag">{project.name}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="call-timer">{formatTime(elapsedSeconds)}</div>
          {meeting.meet_url && (
            <button className="copy-link-btn" onClick={handleCopyMeetLink}>
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Meet Link'}</span>
            </button>
          )}
          <button
            className="copy-link-btn"
            onClick={() => setShowBolnaCall(true)}
            title="Dispatch phone call via Bolna Voice Agent (15c8ef59...)"
          >
            <PhoneCall size={14} />
            <span>Call via Bolna</span>
          </button>
          <button
            className={`tts-toggle-btn ${ttsEnabled ? 'active' : ''}`}
            onClick={() => {
              if (ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
              setTtsEnabled(!ttsEnabled);
            }}
            title={ttsEnabled ? 'Voice Audio Active (TTS)' : 'Voice Audio Muted'}
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Voice {ttsEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body: Video Grid + Interactive Panel */}
      <div className="meeting-body">
        {/* Video Tiles Grid */}
        <div className="video-tiles-grid">
          {/* Tile 1: PROXI AI Representative */}
          <div className={`video-tile proxi-tile ${isSpeaking ? 'active-speaking' : ''}`}>
            <div className="proxi-tile-bg" />
            <div className="proxi-avatar-container">
              <div className={`proxi-glow-ring ${isSpeaking ? 'pulsing' : ''}`}>
                <div className="proxi-core-avatar">
                  <Sparkles size={36} />
                </div>
              </div>

              {/* Dynamic Sound Wave Bars */}
              <div className={`sound-wave-bars ${isSpeaking ? 'animating' : ''}`}>
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="tile-footer">
              <div className="speaker-info">
                <span className="ai-badge">AI REPRESENTATIVE</span>
                <strong className="speaker-name">Proxi</strong>
              </div>
              <div className="speaker-status-pill">
                {isSpeaking ? (
                  <span className="speaking-tag">
                    <Volume2 size={13} /> Speaking
                  </span>
                ) : (
                  <span className="listening-tag">Listening</span>
                )}
              </div>
            </div>

            {/* Live Subtitle Overlay */}
            {isSpeaking && currentSubtitle && (
              <div className="subtitle-overlay">
                <p>"{currentSubtitle}"</p>
              </div>
            )}
          </div>

          {/* Tile 2: Sarah Jenkins (Client VP) */}
          <div className="video-tile stakeholder-tile">
            <div className="tile-avatar-placeholder client-avatar">SJ</div>
            <div className="tile-footer">
              <div className="speaker-info">
                <strong className="speaker-name">Sarah Jenkins</strong>
                <span className="role-sub">VP Digital · {project.client_name}</span>
              </div>
              <div className="mic-indicator">
                <Mic size={14} />
              </div>
            </div>
          </div>

          {/* Tile 3: Alex Chen (Tech Lead) */}
          <div className="video-tile stakeholder-tile">
            <div className="tile-avatar-placeholder tech-avatar">AC</div>
            <div className="tile-footer">
              <div className="speaker-info">
                <strong className="speaker-name">Alex Chen</strong>
                <span className="role-sub">Tech Lead · Engineering</span>
              </div>
              <div className="mic-indicator">
                <Mic size={14} />
              </div>
            </div>
          </div>

          {/* Tile 4: You (Observer / Team Lead) */}
          <div className="video-tile user-tile">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="user-camera-feed"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              <div className="cam-off-box">
                <VideoOff size={24} />
                <span>Camera off</span>
              </div>
            )}
            <div className="tile-footer">
              <div className="speaker-info">
                <strong className="speaker-name">You (Observer)</strong>
                <span className="role-sub">Project Team</span>
              </div>
              <div className="mic-indicator">
                {micActive ? <Mic size={14} /> : <MicOff size={14} color="#e06666" />}
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel: Transcript, Q&A, and Decisions */}
        <aside className="meeting-side-panel">
          <div className="side-panel-tabs">
            <button
              className={activeSideTab === 'transcript' ? 'active' : ''}
              onClick={() => setActiveSideTab('transcript')}
            >
              <MessageSquare size={15} /> Transcript
            </button>
            <button
              className={activeSideTab === 'qa' ? 'active' : ''}
              onClick={() => setActiveSideTab('qa')}
            >
              <Users size={15} /> Ask Proxi
            </button>
            <button
              className={activeSideTab === 'notes' ? 'active' : ''}
              onClick={() => setActiveSideTab('notes')}
            >
              <ListTodo size={15} /> Decisions ({decisions.length})
            </button>
          </div>

          <div className="side-panel-content">
            {/* Tab 1: Live Transcript */}
            {activeSideTab === 'transcript' && (
              <div className="transcript-view">
                <div className="transcript-list">
                  {transcript.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`transcript-message ${entry.isAi ? 'ai-message' : 'human-message'}`}
                    >
                      <div className="msg-header">
                        <strong className="msg-speaker">
                          {entry.speaker}
                          {entry.isAi && <span className="ai-chip">PROXI</span>}
                        </strong>
                        <span className="msg-time">{entry.time}</span>
                      </div>
                      <p className="msg-text">{entry.text}</p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>

                <div className="transcript-actions">
                  <button
                    className="deliver-briefing-btn"
                    onClick={handleDeliverBriefing}
                    disabled={isSpeaking}
                  >
                    <Play size={14} /> {isSpeaking ? 'Delivering...' : 'Deliver Full Briefing'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Interactive Q&A */}
            {activeSideTab === 'qa' && (
              <div className="qa-view">
                <p className="qa-instructions">
                  Simulate stakeholder questions or type your own. Proxi will answer dynamically using
                  project context.
                </p>

                <div className="quick-questions">
                  <span className="quick-label">Stakeholder Prompts:</span>
                  <button
                    onClick={() =>
                      handleAskQuestion('Can you give us a summary of this week’s progress?', 'Sarah Jenkins', 'VP Digital')
                    }
                  >
                    "Summarize this week's progress"
                  </button>
                  <button
                    onClick={() =>
                      handleAskQuestion('What are the open blockers or risks right now?', 'Sarah Jenkins', 'VP Digital')
                    }
                  >
                    "What are the open blockers or risks?"
                  </button>
                  <button
                    onClick={() =>
                      handleAskQuestion('What decisions do you need from us today?', 'Alex Chen', 'Tech Lead')
                    }
                  >
                    "What decisions do you need today?"
                  </button>
                  <button
                    onClick={() =>
                      handleAskQuestion('Are we still on schedule for the milestone?', 'Sarah Jenkins', 'VP Digital')
                    }
                  >
                    "Are we on schedule for milestone?"
                  </button>
                </div>

                <form onSubmit={handleCustomQuestionSubmit} className="custom-question-form">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Ask Proxi any question..."
                  />
                  <button type="submit" disabled={!customQuestion.trim() || isSpeaking}>
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Decisions & Action Items */}
            {activeSideTab === 'notes' && (
              <div className="notes-view">
                <div className="notes-section">
                  <h4>
                    <CheckCircle2 size={16} /> Decisions Captured ({decisions.length})
                  </h4>
                  <ul>
                    {decisions.map((dec, i) => (
                      <li key={i}>{dec}</li>
                    ))}
                  </ul>
                </div>

                <div className="notes-section">
                  <h4>
                    <ListTodo size={16} /> Action Items ({actionItems.length})
                  </h4>
                  <ul>
                    {actionItems.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                <div className="add-note-box">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Capture new decision or action item..."
                  />
                  <div className="add-note-btns">
                    <button type="button" onClick={handleAddDecision} disabled={!newNoteInput.trim()}>
                      + Decision
                    </button>
                    <button type="button" onClick={handleAddActionItem} disabled={!newNoteInput.trim()}>
                      + Action Item
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Control Bar */}
      <footer className="meeting-controls-bar">
        <div className="controls-left">
          <button
            className={`control-circle ${!micActive ? 'muted' : ''}`}
            onClick={handleToggleMic}
            title={micActive ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micActive ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            className={`control-circle ${!cameraActive ? 'muted' : ''}`}
            onClick={handleToggleCamera}
            title={cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {cameraActive ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
        </div>

        <div className="controls-center">
          <button
            className="briefing-trigger-btn"
            onClick={handleDeliverBriefing}
            disabled={isSpeaking}
          >
            <Sparkles size={16} />
            <span>{isSpeaking ? 'Proxi is speaking...' : 'Deliver AI Briefing'}</span>
          </button>
        </div>

        <div className="controls-right">
          <button className="end-call-btn" onClick={handleEndCall}>
            <PhoneOff size={18} />
            <span>Leave & Save Notes</span>
          </button>
        </div>
      </footer>

      {/* Bolna Call Modal */}
      {showBolnaCall && (
        <BolnaCallModal
          project={project}
          onClose={() => setShowBolnaCall(false)}
          onCallDispatched={(execId, phone) => {
            setTranscript((prev) => [
              ...prev,
              {
                speaker: 'Bolna Voice AI',
                role: 'Outbound Agent (15c8ef59...)',
                text: `Dispatched voice call to ${phone} with project briefing context. Execution ID: ${execId}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAi: true,
              },
            ]);
          }}
        />
      )}
    </div>
  );
};
