import React, { useState } from 'react';
import { signInWithEmail, signUp, signInAsGuest } from '@/lib/auth';
import { Sparkles, ArrowRight, X, Shield, Lock, Mail, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'signin') {
        if (!email.trim()) {
          setError('Please provide your email address.');
          setIsLoading(false);
          return;
        }
        await signInWithEmail(email, password);
      } else {
        if (!email.trim() || !name.trim()) {
          setError('Please provide your name and email address.');
          setIsLoading(false);
          return;
        }
        await signUp(name, email, password);
      }

      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      setError((err as Error).message || 'Authentication failed. Please try again.');
    }
  }

  function handleGuestLogin() {
    signInAsGuest();
    onSuccess();
    onClose();
  }

  return (
    <div className="setup-backdrop" onMouseDown={onClose}>
      <div className="setup-modal auth-modal-box" onMouseDown={(e) => e.stopPropagation()}>
        <button className="demo-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="auth-header">
          <div className="auth-logo-badge">
            <Sparkles size={20} />
          </div>
          <h2>
            Welcome to <em>proxi.</em>
          </h2>
          <p>Sign in to access your AI representative workspace, briefings, and live calls.</p>
        </div>

        {/* 1-Click Guest Login Banner */}
        <div className="guest-login-card">
          <div className="guest-card-content">
            <div className="guest-tag">
              <Shield size={13} /> INSTANT ACCESS
            </div>
            <strong>Just testing Proxi?</strong>
            <p>Skip credentials and explore the full live workspace immediately with demo projects.</p>
          </div>
          <button className="guest-btn" onClick={handleGuestLogin}>
            Continue as Guest <ArrowRight size={15} />
          </button>
        </div>

        <div className="setup-divider">
          <span>OR USE EMAIL</span>
        </div>

        {/* Tabs: Sign In / Create Account */}
        <div className="auth-tabs">
          <button
            type="button"
            className={activeTab === 'signin' ? 'active' : ''}
            onClick={() => {
              setActiveTab('signin');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={activeTab === 'signup' ? 'active' : ''}
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleEmailAuth} className="setup-form auth-form">
          {activeTab === 'signup' && (
            <label>
              Full name
              <div className="input-with-icon">
                <UserIcon size={15} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Davis"
                  required
                />
              </div>
            </label>
          )}

          <label>
            Work email
            <div className="input-with-icon">
              <Mail size={15} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-with-icon">
              <Lock size={15} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </label>

          <button className="dark-button setup-submit" disabled={isLoading}>
            {isLoading
              ? 'Authenticating...'
              : activeTab === 'signin'
              ? 'Sign In to Workspace'
              : 'Create Account & Enter'}{' '}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
