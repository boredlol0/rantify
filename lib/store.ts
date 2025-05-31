import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  username: string | null;
  setUser: (user: User | null) => void;
  setUsername: (username: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  username: null,
  setUser: (user) => set({ user }),
  setUsername: (username) => set({ username })
}));