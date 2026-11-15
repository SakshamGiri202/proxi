export interface Project {
  id: string;
  name: string;
  client_name: string;
  description: string;
  progress_summary: string;
  open_issues: string;
  health: 'On track' | 'At risk' | 'Delayed';
  github_url?: string;
  management_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  meeting_at: string;
  meet_url: string;
  attendees: string;
  agenda: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
  briefing: string;
  created_at: string;
  decisions?: string[];
  action_items?: string[];
  transcript?: Array<{ speaker: string; text: string; time: string; isAi?: boolean }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isGuest: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface WorkspaceActivity {
  id: string;
  type: 'briefing_delivered' | 'call_scheduled' | 'blocker_logged' | 'bolna_call' | 'decision_captured' | 'project_created';
  title: string;
  description: string;
  project_id?: string;
  project_name?: string;
  timestamp: string;
  author: string;
}

export interface BolnaAgent {
  id: string;
  agent_name: string;
  agent_status: string;
  agent_welcome_message: string;
  agent_type?: string;
}

export interface ExtractedProjectForm {
  projectName: string;
  clientName: string;
  description: string;
  progressSummary: string;
  openIssues: string;
  githubUrl: string;
  managementUrl: string;
  meetingTitle: string;
  meetingAt: string;
  meetUrl: string;
  attendees: string;
  agenda: string;
}
