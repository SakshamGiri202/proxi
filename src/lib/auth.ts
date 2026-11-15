/* eslint-disable @typescript-eslint/no-unused-vars */
import type { User } from '@/types';

const AUTH_STORAGE_KEY = 'proxi_current_user';
const USERS_STORAGE_KEY = 'proxi_registered_users';

type AuthListener = (user: User | null) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners(user: User | null) {
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function signInAsGuest(): User {
  const guestUser: User = {
    id: 'guest_' + Math.random().toString(36).substring(2, 9),
    name: 'Guest Explorer',
    email: 'guest@proxi.dev',
    role: 'Product Evaluator',
    isGuest: true,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestUser));
  } catch {
    // Ignore storage errors
  }

  notifyListeners(guestUser);
  return guestUser;
}

export async function signInWithEmail(email: string, _password?: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  let users: User[] = [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) users = JSON.parse(raw);
  } catch {
    users = [];
  }

  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    // Create new account if not found
    const namePart = email.split('@')[0] || 'User';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    user = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: formattedName,
      role: 'Project Lead',
      isGuest: false,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Ignore
    }
  }

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore
  }

  notifyListeners(user);
  return user;
}

export async function signUp(name: string, email: string, _password?: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const newUser: User = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    name: name.trim() || 'Team Member',
    role: 'Project Lead',
    isGuest: false,
    createdAt: new Date().toISOString(),
  };

  let users: User[] = [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) users = JSON.parse(raw);
  } catch {
    users = [];
  }

  users = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
  users.push(newUser);

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
  } catch {
    // Ignore
  }

  notifyListeners(newUser);
  return newUser;
}

export function signOut(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore
  }
  notifyListeners(null);
}

export function onAuthStateChange(listener: AuthListener): () => void {
  listeners.add(listener);
  // Emit current user immediately
  listener(getCurrentUser());
  return () => {
    listeners.delete(listener);
  };
}
