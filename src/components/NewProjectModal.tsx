import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Check, X, Sparkles, Video } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onSuccess: (projectId: string, meetingId?: string, launchMeetingNow?: boolean) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [savedProjectId, setSavedProjectId] = useState<string>('');
  const [savedMeetingId, setSavedMeetingId] = useState<string>('');

  async function handleSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSetupError('');

    const form = new FormData(event.currentTarget);
    const projectName = String(form.get('project_name'));
    const clientName = String(form.get('client_name'));
    const description = String(form.get('description'));
    const progressSummary = String(form.get('progress_summary'));
    const openIssues = String(form.get('open_issues'));
    const githubUrl = String(form.get('github_url'));
    const managementUrl = String(form.get('management_url'));

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        client_name: clientName,
        description,
        progress_summary: progressSummary,
        open_issues: openIssues,
        github_url: githubUrl,
        management_url: managementUrl,
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

    const meetingTitle = String(form.get('meeting_title'));
    const meetingAt = new Date(String(form.get('meeting_at'))).toISOString();
    const meetUrl = String(form.get('meet_url'));
    const attendees = String(form.get('attendees'));
    const agenda = String(form.get('agenda'));
    const briefing = `Brief ${project.client_name} on ${project.name}. Progress: ${project.progress_summary}. Key decisions and blockers: ${project.open_issues}.`;

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        project_id: project.id,
        title: meetingTitle,
        meeting_at: meetingAt,
        meet_url: meetUrl,
        attendees,
        agenda,
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
      <div className="setup-modal" onMouseDown={(event) => event.stopPropagation()}>
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
            <span className="eyebrow">
              <Sparkles size={14} /> Start with your project
            </span>
            <h2>
              Give Proxi<br />
              <em>the context.</em>
            </h2>
            <p className="setup-intro">
              Add the essentials once. Proxi will synthesize them to brief your stakeholders with confidence.
            </p>
            <form onSubmit={handleSetup} className="setup-form">
              <div className="setup-form-grid">
                <label>
                  Project name
                  <input name="project_name" required placeholder="Atlas Rebrand" defaultValue="Cloud Migration & API 2.0" />
                </label>
                <label>
                  Client or team
                  <input name="client_name" required placeholder="Northstar Health" defaultValue="Meridian Enterprise" />
                </label>
              </div>

              <label>
                What is this project about?
                <textarea
                  name="description"
                  required
                  placeholder="A short description of the work"
                  defaultValue="Migrating the monolithic billing engine to distributed microservices with zero downtime and automated failover."
                />
              </label>

              <div className="setup-form-grid">
                <label>
                  GitHub link
                  <input name="github_url" type="url" placeholder="https://github.com/..." defaultValue="https://github.com/meridian/cloud-api" />
                </label>
                <label>
                  Management tool link
                  <input name="management_url" type="url" placeholder="Jira, Linear, Notion..." defaultValue="https://linear.app/meridian/issue/API-88" />
                </label>
              </div>

              <div className="setup-form-grid">
                <label>
                  Current progress
                  <textarea
                    name="progress_summary"
                    required
                    placeholder="What has happened recently?"
                    defaultValue="Database schema migration scripts completed. Load tests simulated 10k req/sec with sub-50ms latency."
                  />
                </label>
                <label>
                  Open issues or risks
                  <textarea
                    name="open_issues"
                    placeholder="What needs attention?"
                    defaultValue="Awaiting VPC peering sign-off from enterprise infrastructure team."
                  />
                </label>
              </div>

              <div className="setup-divider">
                <span>First briefing</span>
              </div>

              <div className="setup-form-grid">
                <label>
                  Meeting title
                  <input name="meeting_title" required placeholder="Weekly project update" defaultValue="Weekly Architecture & Sprint Sync" />
                </label>
                <label>
                  Date and time
                  <input
                    name="meeting_at"
                    type="datetime-local"
                    required
                    defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                  />
                </label>
              </div>

              <label>
                Google Meet link
                <input
                  name="meet_url"
                  type="url"
                  required
                  placeholder="https://meet.google.com/..."
                  defaultValue="https://meet.google.com/meridian-arch-sync"
                />
              </label>

              <div className="setup-form-grid">
                <label>
                  Who is attending?
                  <input name="attendees" placeholder="Client, PM, design lead" defaultValue="David (VP Tech), Elena (PM), Proxi" />
                </label>
                <label>
                  What should Proxi cover?
                  <input name="agenda" placeholder="Progress, blockers, decisions" defaultValue="Benchmarking results, VPC peering blocker, cutoff date" />
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
