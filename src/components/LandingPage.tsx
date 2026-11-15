import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Mic2,
  Play,
  Sparkles,
  Video,
  X,
  Shield,
} from 'lucide-react';

interface LandingPageProps {
  onOpenSetup: () => void;
  onGoToWorkspace: () => void;
  onLaunchDemo: () => void;
  onOpenAuth: () => void;
  onGuestAccess: () => void;
}

const features = [
  {
    icon: CalendarDays,
    number: '01',
    title: 'Shows up on time',
    description:
      'Proxi joins scheduled client and stakeholder meetings with the context it needs, so your team never has to repeat the basics.',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Speaks with context',
    description:
      'It turns your project notes, progress, and open issues into a clear, natural briefing built for the people in the room.',
  },
  {
    icon: Mic2,
    number: '03',
    title: 'Keeps work moving',
    description:
      'Proxi answers what it can, captures what it cannot, and sends your team a concise record of decisions and next steps.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSetup,
  onGoToWorkspace,
  onLaunchDemo,
  onOpenAuth,
  onGuestAccess,
}) => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="landing-page">
      <main id="top">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> AI that represents your work
            </div>
            <h1>
              Let your projects<br />
              <em>keep talking.</em>
            </h1>
            <p>
              Proxi is your AI meeting representative. Powered by voice agents that join scheduled calls,
              deliver briefings with context, and give your team back the time to build.
            </p>
            <div className="hero-actions">
              <button className="dark-button" onClick={onOpenSetup}>
                Meet Proxi <ArrowRight size={16} />
              </button>
              <button className="guest-quick-pill" onClick={onGuestAccess} title="Explore workspace without signing up">
                <Shield size={14} /> Try Guest Mode
              </button>
              <button className="play-button" onClick={onLaunchDemo}>
                <span>
                  <Play size={12} fill="currentColor" />
                </span>{' '}
                See it in action
              </button>
            </div>
            <div className="trust-line">
              <div className="avatar-stack">
                <span>JM</span>
                <span>AK</span>
                <span>RS</span>
              </div>
              <span>
                Trusted by fast-moving teams
                <br />
                Connected with Bolna Voice AI
              </span>
            </div>
          </div>

          {/* Interactive Hero Visual */}
          <div className="hero-visual">
            <div className="visual-glow" />
            <div
              className="visual-card interactive-hero-card"
              onClick={onLaunchDemo}
              title="Click to enter Live Meeting Simulation"
            >
              <div className="visual-top">
                <div>
                  <span className="live-label">
                    <i /> LIVE BRIEFING
                  </span>
                  <strong>Northstar Health</strong>
                </div>
                <span className="visual-time">10:42 AM</span>
              </div>
              <div className="visual-meeting">
                <div className="proxi-avatar">
                  <Sparkles size={22} />
                </div>
                <div>
                  <strong>Proxi is in the room</strong>
                  <span>Weekly project update · 4 attendees</span>
                </div>
                <span className="sound-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="transcript">
                <span className="transcript-label">PROXI</span>
                <p>
                  “Discovery is complete. Today I’ll walk you through the design system, the homepage
                  direction, and the two decisions that need your input.”
                </p>
                <div className="transcript-line">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="visual-footer">
                <span>
                  <Check size={13} /> Grounded in project context
                </span>
                <span className="hero-demo-pill">
                  <Video size={12} /> Click to Enter Room
                </span>
              </div>
            </div>

            <div className="floating-note">
              <div className="note-icon">
                <Check size={14} />
              </div>
              <div>
                <strong>Briefing ready</strong>
                <span>Generated 2 min ago</span>
              </div>
            </div>

            <div className="floating-calendar">
              <CalendarDays size={16} />
              <span>
                Next call
                <br />
                <strong>Tomorrow, 10:00 AM</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Signal Section */}
        <section className="signal-section">
          <span className="signal-label">ONE REPRESENTATIVE. EVERY IMPORTANT CONVERSATION.</span>
          <div className="signal-rule" />
          <p>
            From scheduled Google Meet syncs to automated Bolna phone calls, Proxi keeps the thread
            intact when you cannot be there.
          </p>
        </section>

        {/* How It Works */}
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">
              <span /> Simple by design
            </span>
            <h2>
              Your work has a voice.
              <br />
              <em>Give it a presence.</em>
            </h2>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div>
                <h3>Give Proxi the context</h3>
                <p>Talk or paste your project brief, latest progress, and the questions that matter.</p>
              </div>
            </div>
            <div className="step-connector" />
            <div className="step">
              <span className="step-number">2</span>
              <div>
                <h3>Set the meeting</h3>
                <p>Connect Google Meet or dispatch Bolna phone briefings directly to stakeholders.</p>
              </div>
            </div>
            <div className="step-connector" />
            <div className="step">
              <span className="step-number">3</span>
              <div>
                <h3>Stay in the loop</h3>
                <p>Get a clear summary, decisions, and unresolved questions after every call.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="feature-section" id="features">
          <div className="feature-intro">
            <span className="eyebrow">
              <span /> A better kind of delegate
            </span>
            <h2>
              Less catching up.
              <br />
              <em>More moving forward.</em>
            </h2>
            <p>
              Proxi is built for teams who care about clarity, continuity, and making every meeting
              count.
            </p>
          </div>
          <div className="feature-list">
            {features.map(({ icon: Icon, number, title, description }) => (
              <article className="feature-item" key={number}>
                <div className="feature-number">{number}</div>
                <div className="feature-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Quote Section */}
        <section className="quote-section">
          <div className="quote-mark">“</div>
          <blockquote>
            Proxi gives every project a steady voice — even on the days your team cannot make the call.
          </blockquote>
          <div className="quote-byline">
            <span className="quote-avatar">JD</span>
            <span>
              <strong>Jordan Davis</strong>
              <small>Project lead, Acme Creative</small>
            </span>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section" id="cta">
          <div className="cta-inner">
            <div>
              <span className="eyebrow light">
                <span /> Ready when you are
              </span>
              <h2>
                Make your next meeting
                <br />
                <em>the one that moves things.</em>
              </h2>
            </div>
            <div className="cta-side">
              <p>See how Proxi can represent your team, your context, and your momentum.</p>
              <div className="cta-button-group">
                <button className="light-button" onClick={onOpenSetup}>
                  Start with your project <ArrowRight size={16} />
                </button>
                <button className="cta-workspace-link" onClick={onGuestAccess}>
                  Explore as Guest (No Login Required) →
                </button>
                <button className="cta-workspace-link" onClick={onGoToWorkspace}>
                  Go to Workspace →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <button className="proxi-logo footer-logo" onClick={() => scrollTo('top')}>
          <span className="logo-spark">
            <Sparkles size={15} />
          </span>
          <span>
            proxi<span className="logo-dot">.</span>
          </span>
        </button>
        <span>Project intelligence, with a human voice.</span>
        <div>
          <button onClick={() => scrollTo('features')}>Features</button>
          <button onClick={onOpenAuth}>Sign In</button>
          <button onClick={onGuestAccess}>Guest Access</button>
          <button onClick={onGoToWorkspace}>Workspace</button>
          <button onClick={onLaunchDemo}>Demo Room</button>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="demo-backdrop" onMouseDown={() => setShowDemoModal(false)}>
          <div className="demo-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="demo-close" onClick={() => setShowDemoModal(false)}>
              <X size={18} />
            </button>
            <div className="demo-orb">
              <Sparkles size={26} />
            </div>
            <span className="eyebrow">A closer look at Proxi</span>
            <h2>
              Your next meeting,
              <br />
              <em>already briefed.</em>
            </h2>
            <p>
              Experience how Proxi turns project context into a confident, natural conversation.
            </p>
            <button
              className="dark-button"
              onClick={() => {
                setShowDemoModal(false);
                onLaunchDemo();
              }}
            >
              Enter Live Briefing Call <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
