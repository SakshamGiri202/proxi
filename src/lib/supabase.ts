/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import type { Project, Meeting } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 10 &&
  !supabaseUrl.includes('placeholder')
);

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'Northstar Health Patient Portal',
    client_name: 'Northstar Healthcare Systems',
    description: 'Modernizing the patient telehealth booking and medical records portal with HIPAA-compliant real-time scheduling.',
    progress_summary: 'Discovery is complete. Design system tokens locked. Patient dashboard wireframes and appointment flow signed off. Sprint 4 auth & SSO integration in progress.',
    open_issues: 'Security team review pending for SAML 2.0 provider; awaiting client decision on native SMS vs Twilio gateway.',
    health: 'On track',
    github_url: 'https://github.com/northstar/patient-portal-v2',
    management_url: 'https://linear.app/northstar/issue/PORTAL-102',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-2',
    name: 'Atlas Brand & Docs Portal',
    client_name: 'Atlas FinTech',
    description: 'Complete overhaul of the customer-facing developer documentation center and design system component library.',
    progress_summary: 'Component library migrated to React 18 & Tailwind CSS. Homepage hero animations reviewed. Staging portal live.',
    open_issues: 'Dark mode SVG icon exports pending marketing approval.',
    health: 'On track',
    github_url: 'https://github.com/atlas-fintech/docs-portal',
    management_url: 'https://jira.atlas.internal/browse/BR-402',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm-1',
    project_id: 'p-1',
    title: 'Weekly Stakeholder Sync & Sprint 4 Review',
    meeting_at: new Date(Date.now() + 3600000 * 24).toISOString(),
    meet_url: 'https://meet.google.com/qrx-mnpa-tuv',
    attendees: 'Sarah Jenkins (VP Digital), Mark Rao (PM), Alex Chen (Tech Lead), Proxi AI (Project Rep)',
    agenda: 'Design system sign-off review, SSO security review progress, SMS reminder decision',
    status: 'Scheduled',
    briefing: 'Good morning everyone. Discovery is 100% complete and our design system tokens are now locked. Today, I will walk you through the patient dashboard direction, give you an update on the SAML SSO compliance audit, and get your sign-off on the SMS reminder gateway so sprint 5 stays on schedule.',
    created_at: new Date().toISOString(),
    decisions: [
      'Design tokens approved for staging deployment',
      'Security review meeting scheduled for Thursday with client CISO',
    ],
    action_items: [
      'Share Twilio vs Native SMS pricing matrix with Sarah',
      'Deploy sprint 4 staging build by Wednesday 5 PM',
    ],
  },
  {
    id: 'm-2',
    project_id: 'p-2',
    title: 'Atlas Design Handoff & Marketing Alignment',
    meeting_at: new Date(Date.now() + 3600000 * 48).toISOString(),
    meet_url: 'https://meet.google.com/abc-defg-hij',
    attendees: 'Elena Rostova (Head of Brand), Dave Miller (Frontend Lead), Proxi AI',
    agenda: 'Dark mode asset status, staging review, launch timeline',
    status: 'Scheduled',
    briefing: 'Brief Atlas FinTech on docs portal. Highlight that component migration is complete and staging is live for review. Resolve the dark mode icon export blocker with Elena.',
    created_at: new Date().toISOString(),
    decisions: [],
    action_items: [],
  },
];

class LocalDatabase {
  private projectsKey = 'proxi_projects_data';
  private meetingsKey = 'proxi_meetings_data';

  getProjects(): Project[] {
    try {
      const saved = localStorage.getItem(this.projectsKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    this.setProjects(INITIAL_PROJECTS);
    return INITIAL_PROJECTS;
  }

  setProjects(projects: Project[]) {
    try {
      localStorage.setItem(this.projectsKey, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }

  getMeetings(): Meeting[] {
    try {
      const saved = localStorage.getItem(this.meetingsKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    this.setMeetings(INITIAL_MEETINGS);
    return INITIAL_MEETINGS;
  }

  setMeetings(meetings: Meeting[]) {
    try {
      localStorage.setItem(this.meetingsKey, JSON.stringify(meetings));
    } catch {
      // ignore
    }
  }
}

const localDb = new LocalDatabase();

class MockQueryBuilder {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;
  private filterField: string | null = null;
  private filterValue: any = null;
  private orderField: string | null = null;
  private isAscending = true;
  private limitCount: number | null = null;
  private singleResult = false;
  private maybeSingleResult = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    if (this.action !== 'insert') {
      this.action = 'select';
    }
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filterField = column;
    this.filterValue = value;
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this.orderField = column;
    this.isAscending = options.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this.execute();
  }

  maybeSingle() {
    this.maybeSingleResult = true;
    return this.execute();
  }

  then(resolve: (res: { data: any; error: any }) => void) {
    return this.execute().then(resolve);
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      if (this.tableName === 'projects') {
        const projects = localDb.getProjects();

        if (this.action === 'insert') {
          const newRecord: Project = {
            id: 'proj_' + Math.random().toString(36).substring(2, 9),
            name: this.insertData.name || 'Untitled Project',
            client_name: this.insertData.client_name || '',
            description: this.insertData.description || '',
            progress_summary: this.insertData.progress_summary || '',
            open_issues: this.insertData.open_issues || '',
            health: this.insertData.health || 'On track',
            github_url: this.insertData.github_url || '',
            management_url: this.insertData.management_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          projects.unshift(newRecord);
          localDb.setProjects(projects);
          return { data: this.maybeSingleResult || this.singleResult ? newRecord : [newRecord], error: null };
        }

        if (this.action === 'update') {
          let updatedItem: Project | null = null;
          const updated: Project[] = projects.map(item => {
            if (this.filterField && (item as any)[this.filterField] === this.filterValue) {
              const merged: Project = { ...item, ...this.updateData, updated_at: new Date().toISOString() };
              updatedItem = merged;
              return merged;
            }
            return item;
          });
          localDb.setProjects(updated);
          return { data: this.singleResult || this.maybeSingleResult ? updatedItem : updated, error: null };
        }

        if (this.action === 'delete') {
          const filtered = projects.filter(item => {
            if (this.filterField) {
              return (item as any)[this.filterField] !== this.filterValue;
            }
            return true;
          });
          localDb.setProjects(filtered);
          return { data: null, error: null };
        }

        // SELECT
        let results = [...projects];
        if (this.filterField) {
          results = results.filter(item => (item as any)[this.filterField!] === this.filterValue);
        }
        if (this.orderField) {
          results.sort((a, b) => {
            const valA = (a as any)[this.orderField!];
            const valB = (b as any)[this.orderField!];
            if (valA < valB) return this.isAscending ? -1 : 1;
            if (valA > valB) return this.isAscending ? 1 : -1;
            return 0;
          });
        }
        if (this.limitCount) {
          results = results.slice(0, this.limitCount);
        }
        if (this.singleResult) {
          return { data: results[0] || null, error: results.length ? null : { message: 'Row not found' } };
        }
        if (this.maybeSingleResult) {
          return { data: results[0] || null, error: null };
        }
        return { data: results, error: null };
      }

      if (this.tableName === 'meetings') {
        const meetings = localDb.getMeetings();

        if (this.action === 'insert') {
          const newMeeting: Meeting = {
            id: 'meet_' + Math.random().toString(36).substring(2, 9),
            project_id: this.insertData.project_id,
            title: this.insertData.title || 'Scheduled Briefing',
            meeting_at: this.insertData.meeting_at || new Date().toISOString(),
            meet_url: this.insertData.meet_url || '',
            attendees: this.insertData.attendees || '',
            agenda: this.insertData.agenda || '',
            status: this.insertData.status || 'Scheduled',
            briefing: this.insertData.briefing || '',
            created_at: new Date().toISOString(),
            decisions: this.insertData.decisions || [],
            action_items: this.insertData.action_items || [],
          };
          meetings.push(newMeeting);
          localDb.setMeetings(meetings);
          return { data: this.maybeSingleResult || this.singleResult ? newMeeting : [newMeeting], error: null };
        }

        if (this.action === 'update') {
          let updatedItem: Meeting | null = null;
          const updated: Meeting[] = meetings.map(item => {
            if (this.filterField && (item as any)[this.filterField] === this.filterValue) {
              const merged: Meeting = { ...item, ...this.updateData };
              updatedItem = merged;
              return merged;
            }
            return item;
          });
          localDb.setMeetings(updated);
          return { data: this.singleResult || this.maybeSingleResult ? updatedItem : updated, error: null };
        }

        if (this.action === 'delete') {
          const filtered = meetings.filter(item => {
            if (this.filterField) {
              return (item as any)[this.filterField] !== this.filterValue;
            }
            return true;
          });
          localDb.setMeetings(filtered);
          return { data: null, error: null };
        }

        // SELECT
        let results = [...meetings];
        if (this.filterField) {
          results = results.filter(item => (item as any)[this.filterField!] === this.filterValue);
        }
        if (this.orderField) {
          results.sort((a, b) => {
            const valA = (a as any)[this.orderField!];
            const valB = (b as any)[this.orderField!];
            if (valA < valB) return this.isAscending ? -1 : 1;
            if (valA > valB) return this.isAscending ? 1 : -1;
            return 0;
          });
        }
        if (this.limitCount) {
          results = results.slice(0, this.limitCount);
        }
        if (this.singleResult) {
          return { data: results[0] || null, error: results.length ? null : { message: 'Row not found' } };
        }
        if (this.maybeSingleResult) {
          return { data: results[0] || null, error: null };
        }
        return { data: results, error: null };
      }

      return { data: [], error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
}

// Create real client or mock client
const realClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const supabase = {
  from(tableName: string) {
    if (realClient) {
      return realClient.from(tableName);
    }
    return new MockQueryBuilder(tableName) as any;
  },
  isLocalMode: !isSupabaseConfigured,
};
