import type { AdminProfile } from '@tamila/shared';
import { create } from 'zustand';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

type SessionState = {
  status: SessionStatus;
  /** El access token vive solo en memoria (nunca en localStorage). */
  accessToken: string | null;
  admin: AdminProfile | null;
  setSession: (accessToken: string, admin: AdminProfile) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'unknown',
  accessToken: null,
  admin: null,
  setSession: (accessToken, admin) => set({ status: 'authenticated', accessToken, admin }),
  clearSession: () => set({ status: 'anonymous', accessToken: null, admin: null }),
}));
