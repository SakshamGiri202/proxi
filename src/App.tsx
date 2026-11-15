import { useState, useEffect, useCallback } from 'react';
import type { Project, Meeting } from '@/types';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { LandingPage } from '@/components/LandingPage';
import { WorkspaceDashboard } from '@/components/WorkspaceDashboard';
import { MeetingRoom } from '@/components/MeetingRoom';
import { NewProjectModal } from '@/components/NewProjectModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace' | 'meeting'>('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeMeetingData, setActiveMeetingData] = useState<{
    project: Project;
    meeting: Meeting;
  } | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      const [projRes, meetRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').order('meeting_at', { ascending: true }),
      ]);

      const fetchedProjects: Project[] = projRes.data || [];
      const fetchedMeetings: Meeting[] = meetRes.data || [];

      setProjects(fetchedProjects);
      setMeetings(fetchedMeetings);

      if (fetchedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(fetchedProjects[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleLaunchMeeting(project: Project, meeting: Meeting) {
    setActiveMeetingData({ project, meeting });
    setCurrentView('meeting');
  }

  function handleLaunchDemo() {
    const demoProject = projects[0] || {
      id: 'demo-1',
      name: 'Northstar Health Patient Portal',
      client_name: 'Northstar Healthcare Systems',
      description: 'Modernizing the patient telehealth booking and medical records portal.',
      progress_summary: 'Discovery complete, design system tokens locked, dashboard signed off.',
      open_issues: 'Security compliance review for SAML SSO; decision needed on SMS gateway.',
      health: 'On track' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoMeeting = meetings.find((m) => m.project_id === demoProject.id) || {
      id: 'demo-m1',
      project_id: demoProject.id,
      title: 'Weekly Stakeholder Sync & Sprint 4 Review',
      meeting_at: new Date(Date.now() + 86400000).toISOString(),
      meet_url: 'https://meet.google.com/qrx-mnpa-tuv',
      attendees: 'Sarah Jenkins (VP Digital), Mark Rao (PM), Alex Chen (Tech Lead), Proxi AI',
      agenda: 'Design system sign-off review, SSO security review progress, SMS reminder decision',
      status: 'Scheduled' as const,
      briefing: 'Good morning everyone. Discovery is 100% complete and our design system tokens are now locked. Today, I will walk you through the patient dashboard direction, give you an update on the SAML SSO compliance audit, and get your sign-off on the SMS reminder gateway so sprint 5 stays on schedule.',
      created_at: new Date().toISOString(),
      decisions: ['Design tokens approved for staging environment'],
      action_items: ['Send Twilio pricing breakdown to client PM'],
    };

    handleLaunchMeeting(demoProject, demoMeeting);
  }

  function handleExitMeeting() {
    setCurrentView('workspace');
    loadData();
  }

  async function handleUpdateMeeting(updated: Meeting) {
    await supabase.from('meetings').update(updated).eq('id', updated.id);
    loadData();
  }

  async function handleNewProjectSuccess(
    projectId: string,
    meetingId?: string,
    launchMeetingNow?: boolean
  ) {
    await loadData();
    setShowNewProjectModal(false);
    setSelectedProjectId(projectId);

    if (launchMeetingNow) {
      // Find created project and meeting
      const { data: updatedProjects } = await supabase.from('projects').select('*');
      const { data: updatedMeetings } = await supabase.from('meetings').select('*');

      const foundProj = (updatedProjects as Project[])?.find((p) => p.id === projectId);
      const foundMeet = (updatedMeetings as Meeting[])?.find(
        (m) => m.id === meetingId || m.project_id === projectId
      );

      if (foundProj && foundMeet) {
        handleLaunchMeeting(foundProj, foundMeet);
        return;
      }
    }

    setCurrentView('workspace');
  }

  return (
    <div className="proxi-app-root">
      {/* Global Navigation Bar (hidden during active meeting for focus) */}
      {currentView !== 'meeting' && (
        <Navbar
          currentView={currentView}
          onChangeView={setCurrentView}
          onOpenNewProject={() => setShowNewProjectModal(true)}
        />
      )}

      {/* View 1: Landing Page */}
      {currentView === 'landing' && (
        <LandingPage
          onOpenSetup={() => setShowNewProjectModal(true)}
          onGoToWorkspace={() => setCurrentView('workspace')}
          onLaunchDemo={handleLaunchDemo}
        />
      )}

      {/* View 2: Workspace Dashboard */}
      {currentView === 'workspace' && (
        <WorkspaceDashboard
          projects={projects}
          meetings={meetings}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onRefreshData={loadData}
          onLaunchMeeting={handleLaunchMeeting}
          onOpenNewProjectModal={() => setShowNewProjectModal(true)}
        />
      )}

      {/* View 3: Live Meeting Room */}
      {currentView === 'meeting' && activeMeetingData && (
        <MeetingRoom
          project={activeMeetingData.project}
          meeting={activeMeetingData.meeting}
          onExit={handleExitMeeting}
          onUpdateMeeting={handleUpdateMeeting}
        />
      )}

      {/* New Project & Meeting Setup Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={handleNewProjectSuccess}
        />
      )}
    </div>
  );
}
