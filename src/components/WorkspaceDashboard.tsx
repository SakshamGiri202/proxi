import React, { useState } from 'react';
import type { Project, Meeting, User, WorkspaceActivity } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateBriefingScript } from '@/lib/briefingGenerator';
import { EditProjectModal } from './EditProjectModal';
import { NewMeetingModal } from './NewMeetingModal';
import { BolnaCallModal } from './BolnaCallModal';
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
  PhoneCall,
  Activity,
  Zap,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface WorkspaceDashboardProps {
  user: User | null;
  projects: Project[];
  meetings: Meeting[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onRefreshData: () => void;
  onLaunchMeeting: (project: Project, meeting: Meeting) => void;
  onOpenNewProjectModal: () => void;
  onOpenAuthModal?: () => void;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  user,
  projects,
  meetings,
  selectedProjectId,
  onSelectProject,
  onRefreshData,
  onLaunchMeeting,
  onOpenNewProjectModal,
  onOpenAuthModal,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [showBolnaCallModal, setShowBolnaCallModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'project' | 'activity'>('project');

  const [activities, setActivities] = useState<WorkspaceActivity[]>([
    {
      id: 'act-1',
      type: 'briefing_delivered',
      title: 'Proxi delivered Sprint 4 Briefing',
      description: 'Covered design tokens, dashboard wireframes, and SAML SSO blocker resolution.',
      project_name: 'Northstar Health Patient Portal',
      timestamp: 'Just now',
      author: 'Proxi AI',
    },
    {
      id: 'act-2',
      type: 'bolna_call',
      title: 'Bolna Voice Agent (Aarav) dispatched',
      description: 'Outbound voice briefing delivered via Bolna API to stakeholder mobile.',
      project_name: 'Northstar Health Patient Portal',
      timestamp: '18 mins ago',
      author: 'Aarav Voice AI',
    },
    {
      id: 'act-3',
      type: 'decision_captured',
      title: 'Decision logged: SAML 2.0 Provider',
      description: 'Client security team confirmed approval window for Thursday morning.',
      project_name: 'Northstar Health Patient Portal',
      timestamp: '1 hour ago',
      author: 'Sarah Jenkins',
    },
    {
      id: 'act-4',
      type: 'call_scheduled',
      title: 'New Google Meet briefing scheduled',
      description: 'Weekly Stakeholder Sync & Sprint 4 Review set for tomorrow at 10:00 AM.',
      project_name: 'Northstar Health Patient Portal',
      timestamp: '3 hours ago',
      author: user?.name || 'Project Lead',
    },
    {
      id: 'act-5',
      type: 'project_created',
      title: 'Component library staged for Atlas FinTech',
      description: 'React 18 & Tailwind CSS components deployed to documentation staging.',
      project_name: 'Atlas Brand & Docs Portal',
      timestamp: 'Yesterday',
      author: 'Alex Chen',
    },
  ]);

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

  function handleBolnaCallDispatched(executionId: string, phone: string) {
    const newAct: WorkspaceActivity = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      type: 'bolna_call',
      title: `Bolna call queued for ${phone}`,
      description: `Execution ID: ${executionId}. Aarav AI connecting with project briefing context.`,
      project_name: currentProject?.name,
      timestamp: 'Just now',
      author: 'Bolna Voice Engine',
    };
    setActivities((prev) => [newAct, ...prev]);
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
                onClick={() => {
                  onSelectProject(proj.id);
                  setActiveMainTab('project');
                }}
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

        {/* Live Workspace Activity Nav Button */}
        <div className="sidebar-activity-section">
          <button
            className={`activity-tab-trigger ${activeMainTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('activity')}
          >
            <Activity size={15} />
            <span>Workspace Activity Stream</span>
            <span className="live-bubble">● Live</span>
          </button>
        </div>

        {/* Bolna Quick Call Widget in Sidebar */}
        <div className="sidebar-bolna-widget">
          <div className="bolna-widget-header">
            <span className="bolna-tag">
              <PhoneCall size={12} /> BOLNA VOICE AI
            </span>
            <span className="agent-name" title="Agent ID: 15c8ef59-5bb4-4b33-b263-14f7faa21c23">
              Aarav (15c8ef59)
            </span>
          </div>
          <p>Dispatches voice calls using Bolna AI Agent ID <code>15c8ef59-5bb4-4b33-b263-14f7faa21c23</code>.</p>
          <button
            className="bolna-call-trigger-btn"
            onClick={() => setShowBolnaCallModal(true)}
          >
            <PhoneCall size={13} /> Dispatch Phone Call
          </button>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <main className="workspace-content">
        {/* User Welcome & Liquid Health Header */}
        <div className="user-welcome-banner">
          <div className="welcome-left">
            <h2>
              Welcome back, {user ? user.name : 'Guest Explorer'} 👋
            </h2>
            <p>
              Your AI representatives are synchronized across {projects.length} projects and {meetings.length} briefings.
            </p>
          </div>
          <div className="welcome-right">
            {user?.isGuest ? (
              <div className="guest-badge-pill" onClick={onOpenAuthModal} title="Click to create permanent account">
                <Shield size={13} />
                <span>Guest Mode (Demo) · Create Account</span>
              </div>
            ) : (
              <div className="pro-badge-pill">
                <Zap size={13} />
                <span>Proxi Workspace Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Liquid KPIs / Workspace Metrics */}
        <div className="liquid-kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-emerald">
              <CheckCircle2 size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Briefings Delivered</span>
              <strong className="kpi-value">14</strong>
              <span className="kpi-trend positive">↑ 100% on-time</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-teal">
              <TrendingUp size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Eng Hours Saved</span>
              <strong className="kpi-value">32.5 hrs</strong>
              <span className="kpi-trend positive">This sprint</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-coral">
              <AlertCircle size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Active Blockers</span>
              <strong className="kpi-value">{currentProject.open_issues ? '1 Flagged' : '0'}</strong>
              <span className="kpi-trend neutral">Under review</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-spruce">
              <PhoneCall size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Bolna Voice AI</span>
              <strong className="kpi-value">Aarav Active</strong>
              <span className="kpi-trend positive" title="Agent ID: 15c8ef59-5bb4-4b33-b263-14f7faa21c23">ID: 15c8ef59</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs between Project Detail & Liquid Activity */}
        <div className="content-view-tabs">
          <button
            className={activeMainTab === 'project' ? 'active' : ''}
            onClick={() => setActiveMainTab('project')}
          >
            Project Overview & Meetings
          </button>
          <button
            className={activeMainTab === 'activity' ? 'active' : ''}
            onClick={() => setActiveMainTab('activity')}
          >
            Workspace Liquid Activity Stream ({activities.length})
          </button>
        </div>

        {activeMainTab === 'activity' ? (
          /* Liquid Workspace Activity Timeline */
          <div className="liquid-activity-timeline-card">
            <div className="timeline-header">
              <div className="timeline-title-group">
                <Activity size={18} />
                <div>
                  <h3>Overall Workspace Activity Feed</h3>
                  <span>Real-time log of AI briefings, Bolna phone calls, and stakeholder decisions</span>
                </div>
              </div>
              <button
                className="action-pill-btn"
                onClick={() => {
                  const newAct: WorkspaceActivity = {
                    id: 'act_' + Math.random().toString(36).substring(2, 9),
                    type: 'briefing_delivered',
                    title: 'Sync refreshed by user',
                    description: 'All project states verified across Supabase and local cache.',
                    project_name: currentProject.name,
                    timestamp: 'Just now',
                    author: user?.name || 'You',
                  };
                  setActivities([newAct, ...activities]);
                }}
              >
                + Refresh Stream
              </button>
            </div>

            <div className="activity-stream-list">
              {activities.map((act) => (
                <div key={act.id} className="activity-stream-item">
                  <div className={`activity-icon-bullet ${act.type}`}>
                    {act.type === 'bolna_call' ? (
                      <PhoneCall size={14} />
                    ) : act.type === 'briefing_delivered' ? (
                      <Video size={14} />
                    ) : act.type === 'decision_captured' ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Sparkles size={14} />
                    )}
                  </div>
                  <div className="activity-item-body">
                    <div className="act-top">
                      <strong className="act-title">{act.title}</strong>
                      <span className="act-time">{act.timestamp}</span>
                    </div>
                    <p className="act-desc">{act.description}</p>
                    <div className="act-meta">
                      {act.project_name && <span className="act-project-tag">{act.project_name}</span>}
                      <span className="act-author">by {act.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Project Detail View */
          <>
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

                  {/* Bolna Quick Trigger Tag */}
                  <button
                    className="bolna-quick-tag"
                    onClick={() => setShowBolnaCallModal(true)}
                  >
                    <PhoneCall size={12} /> Call Stakeholder via Bolna AI
                  </button>
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
                  <button
                    className="action-pill-btn"
                    onClick={() => setShowBolnaCallModal(true)}
                  >
                    <PhoneCall size={14} />
                    <span>Bolna Phone Call</span>
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
                  <p>Calls Proxi will represent your team in</p>
                </div>
                <div className="meeting-action-btns">
                  <button
                    className="outline-button"
                    onClick={() => setShowBolnaCallModal(true)}
                  >
                    <PhoneCall size={14} /> Dispatch Bolna Call
                  </button>
                  <button
                    className="dark-button"
                    onClick={() => setShowNewMeetingModal(true)}
                  >
                    <Plus size={15} /> Schedule Briefing
                  </button>
                </div>
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
          </>
        )}
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

      {/* Bolna Outbound Phone Call Modal */}
      {showBolnaCallModal && (
        <BolnaCallModal
          project={currentProject}
          onClose={() => setShowBolnaCallModal(false)}
          onCallDispatched={handleBolnaCallDispatched}
        />
      )}
    </div>
  );
};
