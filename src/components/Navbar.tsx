import React, { useState } from 'react';
import { Sparkles, Video, LayoutDashboard, Plus, Menu, X, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  currentView: 'landing' | 'workspace' | 'meeting';
  onChangeView: (view: 'landing' | 'workspace' | 'meeting') => void;
  onOpenNewProject: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  onOpenNewProject,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNav(view: 'landing' | 'workspace' | 'meeting') {
    onChangeView(view);
    setMobileMenuOpen(false);
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
          </div>
        </nav>

        {/* Right Actions */}
        <div className="nav-right-actions">
          <span
            className="storage-status-chip"
            title={
              supabase.isLocalMode
                ? 'Running in local reactive mode (no Supabase env required)'
                : 'Connected to Supabase cloud'
            }
          >
            {supabase.isLocalMode ? '● Local Mode' : '● Supabase Cloud'}
          </span>

          <button className="dark-button new-project-nav-btn" onClick={onOpenNewProject}>
            <Plus size={14} /> New Project
          </button>

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
