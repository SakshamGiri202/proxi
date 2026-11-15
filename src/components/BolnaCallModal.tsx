import React, { useState } from 'react';
import type { Project } from '@/types';
import { triggerBolnaPhoneCall, BOLNA_KEY_NAME, DEFAULT_BOLNA_AGENT_ID } from '@/lib/bolna';
import { Phone, PhoneCall, X, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface BolnaCallModalProps {
  project: Project;
  onClose: () => void;
  onCallDispatched?: (executionId: string, phone: string) => void;
}

export const BolnaCallModal: React.FC<BolnaCallModalProps> = ({
  project,
  onClose,
  onCallDispatched,
}) => {
  const [phone, setPhone] = useState('+14155552671');
  const [recipientName, setRecipientName] = useState('Sarah Jenkins');
  const [isCalling, setIsCalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleDispatchCall(e: React.FormEvent) {
    e.preventDefault();
    setIsCalling(true);
    setStatusMessage('');

    const res = await triggerBolnaPhoneCall(phone, project, recipientName);
    setIsCalling(false);
    setStatusMessage(res.message);
    setIsSuccess(res.success);

    if (res.success && res.executionId && onCallDispatched) {
      onCallDispatched(res.executionId, phone);
    }
  }

  return (
    <div className="setup-backdrop" onMouseDown={onClose}>
      <div className="setup-modal bolna-modal-box" onMouseDown={(e) => e.stopPropagation()}>
        <button className="demo-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="bolna-modal-header">
          <div className="bolna-icon-badge">
            <PhoneCall size={22} />
          </div>
          <span className="eyebrow">
            <Sparkles size={13} /> Bolna Voice AI Platform
          </span>
          <h2>
            Dispatch Phone Briefing<br />
            <em>via Aarav AI</em>
          </h2>
          <p>
            Proxi's Bolna voice agent will call the recipient directly on their phone and deliver the latest
            status update for <strong>{project.name}</strong>.
          </p>
        </div>

        <div className="bolna-config-pill">
          <ShieldCheck size={14} />
          <span>
            API Key: <code>{BOLNA_KEY_NAME}</code> · Agent ID: <code>{DEFAULT_BOLNA_AGENT_ID}</code>
          </span>
        </div>

        {statusMessage && (
          <div className={isSuccess ? 'setup-success-banner' : 'setup-error'}>
            {isSuccess && <CheckCircle2 size={16} />}
            <span>{statusMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="call-dispatched-box">
            <p>
              The phone call execution has been submitted to Bolna. Aarav will introduce itself, summarize
              the progress, address blockers, and record any stakeholder questions for your team.
            </p>
            <button className="dark-button full-width" onClick={onClose}>
              Done <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleDispatchCall} className="setup-form">
            <div className="setup-form-grid">
              <label>
                Recipient's Name
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  required
                />
              </label>
              <label>
                Stakeholder Phone Number (E.164)
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155552671"
                  required
                />
              </label>
            </div>

            <div className="call-preview-card">
              <span className="preview-label">AARAV'S OPENING GREETING:</span>
              <p>
                “Hi {recipientName}, I'm Aarav, an AI assistant from Proxi, joining on behalf of your team
                to walk you through the latest progress on {project.name}. Is this a good time to begin?”
              </p>
            </div>

            <button className="dark-button setup-submit bolna-dispatch-btn" disabled={isCalling}>
              <Phone size={15} />
              {isCalling ? 'Connecting to Bolna API...' : 'Dispatch Outbound Phone Call'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
