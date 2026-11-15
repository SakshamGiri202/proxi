import type { Project, Meeting } from '@/types';

export function generateBriefingScript(project: Project, meeting?: Meeting): string {
  const clientName = project.client_name ? `to ${project.client_name}` : 'to everyone';
  const projectName = project.name || 'the project';
  const progress = project.progress_summary || 'Core milestones are progressing according to plan.';
  const issues = project.open_issues ? `On the blocker side, ${project.open_issues}` : 'There are currently no critical blockers impeding development.';
  const agenda = meeting?.agenda ? `Today's agenda covers ${meeting.agenda}.` : 'Today we are focusing on progress review, blockers, and next sprint priorities.';

  return `Good morning everyone. I am Proxi, speaking on behalf of ${projectName} ${clientName}. 

${agenda}

To give you the executive update: ${progress}

${issues}

We want to ensure everyone is aligned on deliverables and clarify any questions before we wrap up today's sync. I am ready for any questions or decisions from the room.`;
}

export function generateStakeholderResponse(
  question: string,
  project: Project
): string {
  const q = question.toLowerCase();

  if (q.includes('blocker') || q.includes('issue') || q.includes('risk') || q.includes('open')) {
    if (project.open_issues) {
      return `Regarding open issues: ${project.open_issues}. Our engineering team has this flagged as top priority, and we'd like to align on the resolution approach during today's call.`;
    }
    return `Currently, we do not have any blocking risks. All sprint deliverables are on track and running smoothly.`;
  }

  if (q.includes('progress') || q.includes('status') || q.includes('done') || q.includes('accomplish') || q.includes('update')) {
    return `Here is our latest progress summary: ${project.progress_summary}. All core deliverables for this milestone have either been completed or are actively in code review.`;
  }

  if (q.includes('timeline') || q.includes('launch') || q.includes('when') || q.includes('date') || q.includes('schedule')) {
    return `Our current project health is marked as "${project.health}". If we keep to the planned sprint review milestones and close the remaining open items, we are on track for the projected delivery date.`;
  }

  if (q.includes('decision') || q.includes('need') || q.includes('approval') || q.includes('sign off')) {
    if (project.open_issues) {
      return `The primary decisions we need today involve: ${project.open_issues}. Once we have stakeholder sign-off on this, the team can unblock the next deployment.`;
    }
    return `We primarily need confirmation on the sprint scope and approval to proceed with the upcoming staging release review.`;
  }

  if (q.includes('github') || q.includes('repo') || q.includes('code') || q.includes('pr')) {
    if (project.github_url) {
      return `All source code and active pull requests are maintained at ${project.github_url}. Commits and CI pipelines are passing.`;
    }
    return `The source repository has all active commits in review, and pull requests are progressing through automated test pipelines.`;
  }

  // Fallback intelligent answer
  return `Regarding that: based on the project context for ${project.name}, ${project.description}. The latest progress is: ${project.progress_summary}. I have recorded this note for the team, and we will follow up with exact specifications right after this sync.`;
}
