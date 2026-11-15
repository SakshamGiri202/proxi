import React, { useState } from 'react';
import type { Project, Meeting } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateBriefingScript } from '@/lib/briefingGenerator';
import { EditProjectModal } from './EditProjectModal';
import { NewMeetingModal } from './NewMeetingModal';
import {
  Sparkles,
  Calendar,
  Clock,
  Video,
  Plus,
  ExternalLink,
  Github,
  Trello,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Edit3,
  Trash2,
  Users,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface WorkspaceDashboardProps {
  projects: Project[];
  meetings: Meeting[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onRefreshData: () => void;
  onLaunchMeeting: (project: Project, meeting: Meeting) => void;
  onOpenNewProjectModal: () => void;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  projects,
  meetings,
  selectedProjectId,
  onSelectProject,
  onRefreshData,
  onLaunchMeeting,
  onOpenNewProjectModal,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const currentProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  const projectMeetings = currentProject
    ? meetings.filter((m) => m.project_id === currentProject.id)
    : [];

  const upcomingMeetings = projectMeetings.filter((m) => m.status !== 'Completed');
  const pastMeetings = projectMeetings.filter((m) => m.status === 'Completed');

  async function handleDeleteProject(id: string) {
    if (!window.confirm('Are you sure you want to delete this project and its meetings?')) {
      return;
    }
    await supabase.from('projects').delete().eq('id', id);
    onRefreshData();
  }

  async function handleDeleteMeeting(id: string) {
    if (!window.confirm('Delete this scheduled meeting?')) return;
    await supabase.from('meetings').delete().eq('id', id);
    onRefreshData();
  }

  function handleCopyScript(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }

  if (!currentProject) {
    return (
      <div className="workspace-empty-state">
        <div className="empty-box">
          <Sparkles size={36} />
          <h2>No projects found</h2>
          <p>Create your first project context to let Proxi represent your team in meetings.</p>
          <button className="dark-button" onClick={onOpenNewProjectModal}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>
    );
  }

  const generatedBriefing = generateBriefingScript(currentProject, upcomingMeetings[0]);

  return (
    <div className="workspace-layout">
      {/* Sidebar: Projects List */}
      <aside className="workspace-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">
            <Layers size={14} /> Projects ({projects.length})
          </span>
          <button
            className="sidebar-add-btn"
            onClick={onOpenNewProjectModal}
            title="Add New Project"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="project-nav-list">
          {projects.map((proj) => {
            const isSelected = proj.id === currentProject.id;
            const pMeetings = meetings.filter((m) => m.project_id === proj.id);

            return (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`project-nav-item ${isSelected ? 'active' : ''}`}
              >
                <div className="item-top">
                  <strong className="item-name">{proj.name}</strong>
                  <span
                    className={`health-dot ${
                      proj.health === 'On track'
                        ? 'green'
                        : proj.health === 'At risk'
                        ? 'yellow'
                        : 'red'
                    }`}
                    title={`Status: ${proj.health}`}
                  />
                </div>
                <div className="item-client">{proj.client_name}</div>
                <div className="item-meta">
                  <span>{pMeetings.length} briefings</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Project Workspace Content */}
      <main className="workspace-content">
        {/* Project Header Banner */}
        <section className="project-banner">
          <div className="banner-left">
            <div className="client-badge">{currentProject.client_name}</div>
            <h1>{currentProject.name}</h1>
            <p className="project-desc">{currentProject.description}</p>

            {/* Source links & Health Pill */}
            <div className="banner-tags">
              <span
                className={`health-pill ${
                  currentProject.health === 'On track'
                    ? 'pill-green'
                    : currentProject.health === 'At risk'
                    ? 'pill-yellow'
                    : 'pill-red'
                }`}
              >
                ● {currentProject.health}
              </span>

              {currentProject.github_url && (
                <a
                  href={currentProject.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-tag"
                >
                  <Github size={13} /> Repo <ExternalLink size={11} />
                </a>
              )}

              {currentProject.management_url && (
                <a
                  href={currentProject.management_url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-tag"
                >
                  <Trello size={13} /> Tracker <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          <div className="banner-actions">
            <button
              className="outline-button"
              onClick={() => setShowEditModal(true)}
              title="Edit Context"
            >
              <Edit3 size={14} /> Edit Context
            </button>
            <button
              className="delete-icon-btn"
              onClick={() => handleDeleteProject(currentProject.id)}
              title="Delete Project"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </section>

        {/* Project Context & Blockers Grid */}
        <div className="context-cards-grid">
          <div className="context-card progress-card">
            <div className="card-header">
              <span className="card-tag">LATEST PROGRESS</span>
              <CheckCircle2 size={16} className="text-emerald" />
            </div>
            <p>{currentProject.progress_summary}</p>
          </div>

          <div className="context-card issues-card">
            <div className="card-header">
              <span className="card-tag">OPEN ISSUES & RISKS</span>
              <AlertCircle size={16} className="text-coral" />
            </div>
            <p>
              {currentProject.open_issues || 'No critical blockers reported. All systems green.'}
            </p>
          </div>
        </div>

        {/* AI Briefing Script Studio */}
        <section className="briefing-studio-card">
          <div className="studio-header">
            <div className="studio-title-group">
              <div className="studio-spark">
                <Sparkles size={16} />
              </div>
              <div>
                <h3>Proxi Live Briefing Script</h3>
                <span>Grounded in project context, progress, and pending decisions</span>
              </div>
            </div>

            <div className="studio-actions">
              <button
                className="action-pill-btn"
                onClick={() => handleCopyScript(generatedBriefing)}
              >
                {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
              </button>
              {upcomingMeetings.length > 0 && (
                <button
                  className="dark-button launch-briefing-btn"
                  onClick={() => onLaunchMeeting(currentProject, upcomingMeetings[0])}
                >
                  <Video size={15} /> Launch Meeting Room
                </button>
              )}
            </div>
          </div>

          <div className="briefing-script-box">
            <div className="script-label">GENERATED BRIEFING SPEECH:</div>
            <p className="script-content">{generatedBriefing}</p>
          </div>
        </section>

        {/* Scheduled Briefings Section */}
        <section className="meetings-section">
          <div className="section-title-row">
            <div>
              <h3>Scheduled Briefings & Syncs</h3>
              <p>Google Meet calls Proxi will represent your team in</p>
            </div>
            <button
              className="dark-button"
              onClick={() => setShowNewMeetingModal(true)}
            >
              <Plus size={15} /> Schedule Briefing
            </button>
          </div>

          {upcomingMeetings.length === 0 ? (
            <div className="no-meetings-box">
              <Calendar size={28} />
              <p>No upcoming briefings scheduled for this project.</p>
              <button
                className="light-button"
                onClick={() => setShowNewMeetingModal(true)}
              >
                Schedule First Briefing <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="meetings-grid">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="meeting-card">
                  <div className="meeting-card-top">
                    <span className="status-badge-scheduled">
                      ● {meeting.status}
                    </span>
                    <button
                      className="card-delete-btn"
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      title="Delete meeting"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h4>{meeting.title}</h4>

                  <div className="meeting-details">
                    <div className="detail-line">
                      <Clock size={13} />
                      <span>
                        {new Date(meeting.meeting_at).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(meeting.meeting_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {meeting.attendees && (
                      <div className="detail-line">
                        <Users size={13} />
                        <span>{meeting.attendees}</span>
                      </div>
                    )}
                  </div>

                  {meeting.agenda && (
                    <div className="meeting-agenda-box">
                      <strong>Agenda:</strong> {meeting.agenda}
                    </div>
                  )}

                  <div className="meeting-card-footer">
                    <button
                      className="dark-button full-width"
                      onClick={() => onLaunchMeeting(currentProject, meeting)}
                    >
                      <Video size={14} /> Launch Proxi in Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Completed Meetings & Notes */}
          {pastMeetings.length > 0 && (
            <div className="past-meetings-section">
              <h4>Completed Meetings & Captured Decisions</h4>
              <div className="past-meetings-list">
                {pastMeetings.map((m) => (
                  <div key={m.id} className="past-meeting-item">
                    <div className="past-header">
                      <strong>{m.title}</strong>
                      <span>{new Date(m.meeting_at).toLocaleDateString()}</span>
                    </div>
                    {m.decisions && m.decisions.length > 0 && (
                      <div className="past-decisions">
                        <span className="dec-title">Decisions recorded:</span>
                        <ul>
                          {m.decisions.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Edit Project Context Modal */}
      {showEditModal && (
        <EditProjectModal
          project={currentProject}
          onClose={() => setShowEditModal(false)}
          onUpdated={onRefreshData}
        />
      )}

      {/* New Meeting Modal */}
      {showNewMeetingModal && (
        <NewMeetingModal
          project={currentProject}
          onClose={() => setShowNewMeetingModal(false)}
          onMeetingCreated={onRefreshData}
        />
      )}
    </div>
  );
};
