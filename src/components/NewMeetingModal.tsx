import React, { useState } from 'react';
import type { Project } from '@/types';
import { supabase } from '@/lib/supabase';
import { X, ArrowRight, CalendarDays } from 'lucide-react';

interface NewMeetingModalProps {
  project: Project;
  onClose: () => void;
  onMeetingCreated: () => void;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  project,
  onClose,
  onMeetingCreated,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Default time: tomorrow at 10:00 AM
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(10, 0, 0, 0);
  const defaultDateStr = defaultDate.toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const title = String(form.get('meeting_title'));
    const meetingAt = new Date(String(form.get('meeting_at'))).toISOString();
    const meetUrl = String(form.get('meet_url'));
    const attendees = String(form.get('attendees'));
    const agenda = String(form.get('agenda'));
    const briefingNotes = String(form.get('briefing') || '');

    const generatedBriefing = briefingNotes || `Brief ${project.client_name} on ${project.name}. Update on ${project.progress_summary}. Address blockers: ${project.open_issues}.`;

    const { error: insertError } = await supabase.from('meetings').insert({
      project_id: project.id,
      title,
      meeting_at: meetingAt,
      meet_url: meetUrl,
      attendees,
      agenda,
      status: 'Scheduled',
      briefing: generatedBriefing,
      decisions: [],
      action_items: [],
    });

    setIsSaving(false);

    if (insertError) {
      setError('Could not schedule briefing. Please verify your details.');
      return;
    }

    onMeetingCreated();
    onClose();
  }

  return (
    <div className="setup-backdrop" onMouseDown={onClose}>
      <div className="setup-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="demo-close" onClick={onClose}>
          <X size={18} />
        </button>

        <span className="eyebrow">
          <CalendarDays size={13} /> Schedule Briefing
        </span>
        <h2>
          Prepare Proxi for<br />
          <em>{project.name}</em>
        </h2>
        <p className="setup-intro">
          Set the date, attendees, and agenda. Proxi will synthesize your project context into speaking points.
        </p>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="setup-form-grid">
            <label>
              Meeting title
              <input name="meeting_title" required placeholder="Weekly Stakeholder Sync" defaultValue="Weekly Progress Briefing" />
            </label>
            <label>
              Date and time
              <input name="meeting_at" type="datetime-local" required defaultValue={defaultDateStr} />
            </label>
          </div>

          <label>
            Google Meet / Zoom link
            <input name="meet_url" type="url" required placeholder="https://meet.google.com/xyz-abcd-efg" defaultValue="https://meet.google.com/proxi-sync" />
          </label>

          <div className="setup-form-grid">
            <label>
              Attendees
              <input name="attendees" placeholder="Sarah (VP), Alex (Tech Lead), Team" defaultValue="Stakeholders, Project Lead, Proxi" />
            </label>
            <label>
              Key Agenda Topics
              <input name="agenda" placeholder="Sprint review, blockers, design sign-off" defaultValue="Progress update, open blocker resolution, sprint 5 goals" />
            </label>
          </div>

          <label>
            Special instructions or emphasis for Proxi (optional)
            <textarea name="briefing" placeholder="Highlight our completion of user testing and prompt for sign-off on the API provider." />
          </label>

          <button className="dark-button setup-submit" disabled={isSaving}>
            {isSaving ? 'Scheduling Briefing...' : 'Schedule & Generate AI Briefing'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
