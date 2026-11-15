import type { ExtractedProjectForm } from '@/types';

export function extractProjectFormFromSpeech(
  conversationText: string,
  existingForm?: Partial<ExtractedProjectForm>
): ExtractedProjectForm {
  const text = conversationText.trim();
  const lower = text.toLowerCase();

  // Initialize with existing or default values
  const result: ExtractedProjectForm = {
    projectName: existingForm?.projectName || '',
    clientName: existingForm?.clientName || '',
    description: existingForm?.description || '',
    progressSummary: existingForm?.progressSummary || '',
    openIssues: existingForm?.openIssues || '',
    githubUrl: existingForm?.githubUrl || '',
    managementUrl: existingForm?.managementUrl || '',
    meetingTitle: existingForm?.meetingTitle || 'Weekly Stakeholder Briefing',
    meetingAt: existingForm?.meetingAt || getDefaultMeetingTime(),
    meetUrl: existingForm?.meetUrl || 'https://meet.google.com/proxi-sync',
    attendees: existingForm?.attendees || 'Stakeholders, Project Lead, Proxi AI',
    agenda: existingForm?.agenda || 'Milestone review, open blockers, next steps',
  };

  // 1. Client extraction
  const clientMatch =
    text.match(/(?:for client|for|client is|working with|client:)\s+([A-Z][A-Za-z0-9&.\s]{2,30}?)(?=[.,;\n]|and|who|we|$)/i) ||
    text.match(/(Northstar Health|Atlas FinTech|Meridian Enterprise|Acme Creative|Stripe|Google|Amazon|Linear)/i);
  if (clientMatch && clientMatch[1]) {
    result.clientName = clientMatch[1].trim();
  }

  // 2. Project name extraction
  const projectMatch =
    text.match(/(?:project(?: name)?(?: is)?|called|building (?:a |the )?|working on (?:a |the )?)\s+([A-Z0-9][A-Za-z0-9&.\s-]{2,40}?)(?=[.,;\n]|for|with|which|and|$)/i) ||
    text.match(/([A-Z][A-Za-z0-9\s-]{2,30}\s+(?:Portal|Platform|App|Redesign|Refresh|Migration|API|Dashboard|System))/i);
  if (projectMatch && projectMatch[1]) {
    result.projectName = projectMatch[1].trim();
  } else if (!result.projectName && result.clientName) {
    result.projectName = `${result.clientName} Core Platform`;
  }

  // 3. Progress extraction
  const progressMatch =
    text.match(/(?:progress(?: is)?:?|recently|completed|we have done|we completed|finished|accomplished|done so far)\s*[:-]?\s*([^.,;\n]+(?:\.[^.,;\n]+)?)/i) ||
    text.match(/(?:discovery is complete[^.]*\.)/i);
  if (progressMatch && progressMatch[1]) {
    result.progressSummary = progressMatch[1].trim();
  } else if (lower.includes('discovery') || lower.includes('design token') || lower.includes('staging')) {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const progressSentence = sentences.find(
      (s) =>
        s.toLowerCase().includes('discovery') ||
        s.toLowerCase().includes('complete') ||
        s.toLowerCase().includes('deployed') ||
        s.toLowerCase().includes('built') ||
        s.toLowerCase().includes('tokens')
    );
    if (progressSentence) {
      result.progressSummary = progressSentence.trim();
    }
  }

  // 4. Blockers / Open issues extraction
  const blockerMatch =
    text.match(/(?:blocker[s]?|blocked by|risk[s]?|open issue[s]?|waiting for|waiting on|pending|needs? attention|needs? approval)\s*[:-]?\s*([^.,;\n]+(?:\.[^.,;\n]+)?)/i);
  if (blockerMatch && blockerMatch[1]) {
    result.openIssues = blockerMatch[1].trim();
  } else if (lower.includes('sso') || lower.includes('security') || lower.includes('approval') || lower.includes('sign-off')) {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const blockerSentence = sentences.find(
      (s) =>
        s.toLowerCase().includes('sso') ||
        s.toLowerCase().includes('security') ||
        s.toLowerCase().includes('sign-off') ||
        s.toLowerCase().includes('approval') ||
        s.toLowerCase().includes('waiting') ||
        s.toLowerCase().includes('pending')
    );
    if (blockerSentence) {
      result.openIssues = blockerSentence.trim();
    }
  }

  // 5. Description extraction
  if (text.length > 20 && !result.description) {
    result.description = `${result.projectName ? result.projectName : 'Project'} initiative ${result.clientName ? `for ${result.clientName}` : ''}. ${result.progressSummary ? `Current focus: ${result.progressSummary}` : ''}`.trim();
  }

  // 6. Attendees extraction
  const attendeesMatch = text.match(/(?:with|attendees?(?: are)?:?|meeting with)\s+([A-Z][a-zA-Z\s,]+(?:and [A-Z][a-zA-Z\s]+)?)/i);
  if (attendeesMatch && attendeesMatch[1] && !attendeesMatch[1].toLowerCase().includes('google meet')) {
    result.attendees = attendeesMatch[1].trim();
  }

  // 7. Meet URL extraction
  const urlMatch = text.match(/(https?:\/\/(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)\/[a-zA-Z0-9-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    result.meetUrl = urlMatch[1];
  }

  // 8. Meeting time parsing
  if (lower.includes('tomorrow') || lower.includes('friday') || lower.includes('monday') || lower.includes('am') || lower.includes('pm')) {
    const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    const date = new Date();
    date.setDate(date.getDate() + 1);
    if (timeMatch) {
      const parsedHour = parseInt(timeMatch[1], 10);
      const isPm = lower.includes('pm') && parsedHour < 12;
      date.setHours(isPm ? parsedHour + 12 : parsedHour, 0, 0, 0);
    } else {
      date.setHours(10, 0, 0, 0);
    }
    result.meetingAt = date.toISOString().slice(0, 16);
  }

  // 9. Agenda extraction
  const agendaMatch = text.match(/(?:agenda(?: is)?:?|discuss|cover|talk about)\s*[:-]?\s*([^.,;\n]+)/i);
  if (agendaMatch && agendaMatch[1]) {
    result.agenda = agendaMatch[1].trim();
  } else if (result.openIssues) {
    result.agenda = `Progress update, resolution on ${result.openIssues}, and milestone sign-off`;
  }

  // Fallbacks if user provided rough text
  if (!result.projectName && text.length > 5) {
    result.projectName = text.split(/[.,;\n]/)[0].slice(0, 35).trim();
  }
  if (!result.progressSummary && text.length > 15) {
    result.progressSummary = text;
  }

  return result;
}

function getDefaultMeetingTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString().slice(0, 16);
}
