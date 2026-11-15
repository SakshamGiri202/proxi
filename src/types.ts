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
