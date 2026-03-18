'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({ token: null, setToken: () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(window.localStorage.getItem('token'));
  }, []);

  const value = useMemo(
    () => ({
      token,
      setToken: (nextToken: string | null) => {
        if (nextToken) window.localStorage.setItem('token', nextToken);
        else window.localStorage.removeItem('token');
        setTokenState(nextToken);
      },
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
