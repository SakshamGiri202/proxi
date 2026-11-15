import React, { useState } from 'react';
import {
  Sparkles,
  Video,
  LayoutDashboard,
  Plus,
  Menu,
  X,
  Globe,
  LogOut,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface NavbarProps {
  currentView: 'landing' | 'workspace' | 'meeting';
  onChangeView: (view: 'landing' | 'workspace' | 'meeting') => void;
  onOpenNewProject: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  onOpenNewProject,
  user,
  onOpenAuth,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNav(view: 'landing' | 'workspace' | 'meeting') {
    onChangeView(view);
    setMobileMenuOpen(false);
  }

  function getInitials(name: string) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <header className="global-navbar">
      <div className="nav-inner">
        <button
          className="proxi-logo"
          onClick={() => handleNav('landing')}
          aria-label="Proxi Home"
        >
          <span className="logo-spark">
            <Sparkles size={15} />
          </span>
          <span>
            proxi<span className="logo-dot">.</span>
          </span>
        </button>

        {/* View Switcher Navigation */}
        <nav className={`global-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <button
            className={`nav-tab-btn ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => handleNav('landing')}
          >
            <Globe size={14} /> Overview
          </button>
          <button
            className={`nav-tab-btn ${currentView === 'workspace' ? 'active' : ''}`}
            onClick={() => handleNav('workspace')}
          >
            <LayoutDashboard size={14} /> Workspace
          </button>
          <button
            className={`nav-tab-btn ${currentView === 'meeting' ? 'active' : ''}`}
            onClick={() => handleNav('meeting')}
          >
            <Video size={14} /> Live Meeting Room
          </button>

          <div className="mobile-only-actions">
            <button
              className="dark-button full-width"
              onClick={() => {
                onOpenNewProject();
                setMobileMenuOpen(false);
              }}
            >
              <Plus size={15} /> New Project
            </button>
            {!user ? (
              <button
                className="light-button full-width"
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
              >
                Sign In / Guest Access
              </button>
            ) : (
              <button
                className="outline-button full-width"
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut size={14} /> Sign Out ({user.name})
              </button>
            )}
          </div>
        </nav>

        {/* Right Actions */}
        <div className="nav-right-actions">
          <span
            className="storage-status-chip"
            title={
              supabase.isLocalMode
                ? 'Running with local reactive data (Supabase optional)'
                : 'Connected to Supabase cloud'
            }
          >
            {supabase.isLocalMode ? '● Local Mode' : '● Supabase Cloud'}
          </span>

          <button className="dark-button new-project-nav-btn" onClick={onOpenNewProject}>
            <Plus size={14} /> New Project
          </button>

          {/* User Profile or Sign In / Guest Button */}
          {user ? (
            <div className="navbar-user-profile">
              <div
                className={`user-avatar-badge ${user.isGuest ? 'guest' : ''}`}
                title={`${user.name} (${user.email})`}
              >
                {getInitials(user.name)}
              </div>
              <div className="user-details-dropdown">
                <span className="user-name-label">{user.name}</span>
                <span className="user-role-label">
                  {user.isGuest ? (
                    <span className="guest-tag-inline">
                      <Shield size={10} /> Guest
                    </span>
                  ) : (
                    'Pro Account'
                  )}
                </span>
              </div>
              <button
                className="sign-out-btn"
                onClick={onSignOut}
                title="Sign out of workspace"
                aria-label="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className="nav-login-btn" onClick={onOpenAuth}>
              <UserIcon size={14} />
              <span>Sign In / Guest</span>
            </button>
          )}

          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
};
