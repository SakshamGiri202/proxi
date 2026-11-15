/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { extractProjectFormFromSpeech } from '@/lib/formAiExtractor';
import {
  ArrowRight,
  Check,
  X,
  Sparkles,
  Video,
  Mic,
  MicOff,
  CheckCircle2,
  FileText,
  Wand2,
} from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onSuccess: (projectId: string, meetingId?: string, launchMeetingNow?: boolean) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'ai_voice' | 'manual'>('ai_voice');
  const [isSaving, setIsSaving] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [savedProjectId, setSavedProjectId] = useState<string>('');
  const [savedMeetingId, setSavedMeetingId] = useState<string>('');

  // Voice & AI Conversation State
  const [isListening, setIsListening] = useState(false);
  const [speechPrompt, setSpeechPrompt] = useState(
    'We are building the patient telehealth booking portal for Northstar Health. Discovery is complete and design system tokens are locked, but we are awaiting SAML SSO security approval from their infrastructure team. We have our weekly sync tomorrow at 10 AM with Sarah Jenkins on Google Meet.'
  );
  const recognitionRef = useRef<any>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    projectName: 'Northstar Health Patient Portal',
    clientName: 'Northstar Healthcare Systems',
    description: 'Modernizing patient telehealth booking with HIPAA-compliant real-time scheduling.',
    progressSummary: 'Discovery complete and design system tokens locked. Wireframes signed off.',
    openIssues: 'Awaiting SAML SSO security approval from client infrastructure team.',
    githubUrl: 'https://github.com/northstar/patient-portal',
    managementUrl: 'https://linear.app/northstar/issue/PORTAL-102',
    meetingTitle: 'Weekly Stakeholder Sync & Sprint Review',
    meetingAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    meetUrl: 'https://meet.google.com/qrx-mnpa-tuv',
    attendees: 'Sarah Jenkins (VP Digital), Alex Chen (Tech Lead), Proxi AI',
    agenda: 'Design token sign-off, SAML SSO blocker resolution, next sprint goals',
  });

  // Extract form fields whenever speechPrompt changes
  useEffect(() => {
    if (speechPrompt.trim()) {
      setFormData((prev) => {
        const extracted = extractProjectFormFromSpeech(speechPrompt, prev);
        return {
          ...prev,
          projectName: extracted.projectName || prev.projectName,
          clientName: extracted.clientName || prev.clientName,
          description: extracted.description || prev.description,
          progressSummary: extracted.progressSummary || prev.progressSummary,
          openIssues: extracted.openIssues || prev.openIssues,
          attendees: extracted.attendees || prev.attendees,
          agenda: extracted.agenda || prev.agenda,
          meetUrl: extracted.meetUrl || prev.meetUrl,
          meetingAt: extracted.meetingAt || prev.meetingAt,
        };
      });
    }
  }, [speechPrompt]);

  // Web Speech Recognition Handler
  function toggleSpeechRecognition() {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your project details in the box.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setSpeechPrompt((prev) => `${prev} ${currentTranscript}`.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  }

  function handleUseSamplePrompt(promptText: string) {
    setSpeechPrompt(promptText);
  }

  async function handleSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSetupError('');

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: formData.projectName,
        client_name: formData.clientName,
        description: formData.description,
        progress_summary: formData.progressSummary,
        open_issues: formData.openIssues,
        github_url: formData.githubUrl,
        management_url: formData.managementUrl,
        health: 'On track',
      })
      .select()
      .maybeSingle();

    if (projectError || !project) {
      setSetupError('We could not save the project yet. Please check the details and try again.');
      setIsSaving(false);
      return;
    }

    setSavedProjectId(project.id);

    const briefing = `Brief ${project.client_name} on ${project.name}. Progress: ${project.progress_summary}. Key decisions and blockers: ${project.open_issues}.`;

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        project_id: project.id,
        title: formData.meetingTitle,
        meeting_at: new Date(formData.meetingAt).toISOString(),
        meet_url: formData.meetUrl,
        attendees: formData.attendees,
        agenda: formData.agenda,
        status: 'Scheduled',
        briefing,
        decisions: [],
        action_items: [],
      })
      .select()
      .maybeSingle();

    setIsSaving(false);

    if (meetingError) {
      setSetupError('The project was saved, but the briefing could not be scheduled. Please try again.');
      return;
    }

    if (meeting) {
      setSavedMeetingId(meeting.id);
    }
    setSetupComplete(true);
  }

  return (
    <div className="setup-backdrop" onMouseDown={onClose}>
      <div className="setup-modal project-modal-expanded" onMouseDown={(event) => event.stopPropagation()}>
        <button className="demo-close" onClick={onClose}>
          <X size={18} />
        </button>

        {setupComplete ? (
          <div className="setup-success">
            <div className="success-icon">
              <Check size={28} />
            </div>
            <span className="eyebrow">Project Initialized</span>
            <h2>
              Proxi has the<br />
              <em>full context.</em>
            </h2>
            <p>
              Your project and initial briefing have been saved. Proxi will use this background to represent your team on calls.
            </p>
            <div className="success-action-buttons">
              <button
                className="dark-button"
                onClick={() => onSuccess(savedProjectId, savedMeetingId, true)}
              >
                <Video size={16} /> Test Live Briefing Room
              </button>
              <button
                className="light-button"
                onClick={() => onSuccess(savedProjectId, savedMeetingId, false)}
              >
                Open in Workspace <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {setupError && <div className="setup-error">{setupError}</div>}
            
            <div className="modal-title-row">
              <div>
                <span className="eyebrow">
                  <Sparkles size={14} /> AI Project Setup
                </span>
                <h2>
                  Give Proxi<br />
                  <em>the context.</em>
                </h2>
              </div>

              {/* Mode Switcher: AI Voice Talk vs Manual Entry */}
              <div className="entry-mode-toggle">
                <button
                  type="button"
                  className={activeTab === 'ai_voice' ? 'active' : ''}
                  onClick={() => setActiveTab('ai_voice')}
                >
                  <Wand2 size={14} /> AI Voice & Talk Auto-Fill
                </button>
                <button
                  type="button"
                  className={activeTab === 'manual' ? 'active' : ''}
                  onClick={() => setActiveTab('manual')}
                >
                  <FileText size={14} /> Manual Form
                </button>
              </div>
            </div>

            {/* AI Voice & Talk Auto-Fill Studio */}
            {activeTab === 'ai_voice' && (
              <div className="ai-talk-studio">
                <div className="talk-avatar-row">
                  <div className={`studio-avatar-ring ${isListening ? 'active-listening' : ''}`}>
                    <Sparkles size={24} />
                  </div>
                  <div className="talk-greeting">
                    <strong>Talk or type to Proxi:</strong>
                    <p>
                      Speak or paste project updates naturally. Proxi will automatically detect and populate all project context, blockers, and meeting details below!
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`voice-record-btn ${isListening ? 'recording' : ''}`}
                    onClick={toggleSpeechRecognition}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    <span>{isListening ? 'Stop Listening' : 'Speak to AI'}</span>
                  </button>
                </div>

                <div className="talk-input-container">
                  <textarea
                    value={speechPrompt}
                    onChange={(e) => setSpeechPrompt(e.target.value)}
                    placeholder="Speak or type: 'We are building Northstar Health's patient portal. Discovery is complete, design tokens locked, waiting on security team sign-off for SSO. Meeting tomorrow at 10 AM with Sarah Jenkins'..."
                    rows={3}
                  />
                </div>

                {/* Quick Presets */}
                <div className="sample-prompts-bar">
                  <span className="sample-label">Or try a preset:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUseSamplePrompt(
                        'We are building the patient telehealth portal for Northstar Health. Discovery is complete and design system tokens are locked, but awaiting SAML SSO approval. Sync tomorrow at 10 AM with Sarah Jenkins.'
                      )
                    }
                  >
                    Northstar Health Portal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUseSamplePrompt(
                        'Developer documentation and component library for Atlas FinTech. Component migration to React 18 & Tailwind complete, staging live, awaiting dark mode icon exports. Meeting Friday at 2:30 PM with Elena.'
                      )
                    }
                  >
                    Atlas Brand Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUseSamplePrompt(
                        'Migrating core billing engine to microservices for Meridian Enterprise. Load testing passed 10k req/s, pending VPC peering approval. Architecture sync tomorrow at 11 AM.'
                      )
                    }
                  >
                    Meridian Microservices
                  </button>
                </div>

                {/* Real-time Extracted Badges */}
                <div className="extracted-fields-preview">
                  <span className="extracted-title">
                    <CheckCircle2 size={13} /> AI Extracted Context:
                  </span>
                  <div className="detected-badges-wrap">
                    {formData.projectName && (
                      <span className="detected-badge">
                        <strong>Project:</strong> {formData.projectName}
                      </span>
                    )}
                    {formData.clientName && (
                      <span className="detected-badge">
                        <strong>Client:</strong> {formData.clientName}
                      </span>
                    )}
                    {formData.progressSummary && (
                      <span className="detected-badge">
                        <strong>Progress:</strong> {formData.progressSummary.slice(0, 45)}...
                      </span>
                    )}
                    {formData.openIssues && (
                      <span className="detected-badge blocker">
                        <strong>Blocker:</strong> {formData.openIssues.slice(0, 45)}...
                      </span>
                    )}
                    {formData.attendees && (
                      <span className="detected-badge">
                        <strong>Attendees:</strong> {formData.attendees}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields (Auto-filled live from AI or editable manually) */}
            <form onSubmit={handleSetup} className="setup-form">
              <div className="setup-form-grid">
                <label>
                  Project name
                  <input
                    name="project_name"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  />
                </label>
                <label>
                  Client or team
                  <input
                    name="client_name"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </label>
              </div>

              <label>
                What is this project about?
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </label>

              <div className="setup-form-grid">
                <label>
                  GitHub link
                  <input
                    name="github_url"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  />
                </label>
                <label>
                  Management tool link (Jira, Linear, Notion)
                  <input
                    name="management_url"
                    type="url"
                    value={formData.managementUrl}
                    onChange={(e) => setFormData({ ...formData, managementUrl: e.target.value })}
                  />
                </label>
              </div>

              <div className="setup-form-grid">
                <label>
                  Current progress
                  <textarea
                    name="progress_summary"
                    required
                    value={formData.progressSummary}
                    onChange={(e) => setFormData({ ...formData, progressSummary: e.target.value })}
                  />
                </label>
                <label>
                  Open issues or risks
                  <textarea
                    name="open_issues"
                    value={formData.openIssues}
                    onChange={(e) => setFormData({ ...formData, openIssues: e.target.value })}
                  />
                </label>
              </div>

              <div className="setup-divider">
                <span>First briefing</span>
              </div>

              <div className="setup-form-grid">
                <label>
                  Meeting title
                  <input
                    name="meeting_title"
                    required
                    value={formData.meetingTitle}
                    onChange={(e) => setFormData({ ...formData, meetingTitle: e.target.value })}
                  />
                </label>
                <label>
                  Date and time
                  <input
                    name="meeting_at"
                    type="datetime-local"
                    required
                    value={formData.meetingAt}
                    onChange={(e) => setFormData({ ...formData, meetingAt: e.target.value })}
                  />
                </label>
              </div>

              <label>
                Google Meet link
                <input
                  name="meet_url"
                  type="url"
                  required
                  value={formData.meetUrl}
                  onChange={(e) => setFormData({ ...formData, meetUrl: e.target.value })}
                />
              </label>

              <div className="setup-form-grid">
                <label>
                  Who is attending?
                  <input
                    name="attendees"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  />
                </label>
                <label>
                  What should Proxi cover?
                  <input
                    name="agenda"
                    value={formData.agenda}
                    onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  />
                </label>
              </div>

              <button className="dark-button setup-submit" disabled={isSaving}>
                {isSaving ? 'Saving your briefing...' : 'Save project & schedule briefing'}{' '}
                <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
