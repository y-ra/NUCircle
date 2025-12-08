import { createContext, useState, ReactNode } from 'react';
import { SafeDatabaseUser } from '../types/types';

/**
 * Interface representing the context type for user login management.
 */
export interface LoginContextType {
  user: SafeDatabaseUser | null;
  setUser: (user: SafeDatabaseUser | null) => void;
}

const LoginContext = createContext<LoginContextType | null>(null);

/**
 * Provider component that wraps the app and provides login state
 */
export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SafeDatabaseUser | null>(null);

  return <LoginContext.Provider value={{ user, setUser }}>{children}</LoginContext.Provider>;
};

export default LoginContext;
