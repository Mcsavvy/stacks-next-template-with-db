"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { z } from "zod";

export type Role = "user" | "moderator" | "admin";

const clientSessionUserSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
});

const clientSessionSchema = z.object({
  user: clientSessionUserSchema,
  token: z.string(),
});

export type ClientSessionUser = z.infer<typeof clientSessionUserSchema>;
export type ClientSession = z.infer<typeof clientSessionSchema>;

const STORAGE_KEY = "dapp_session";

interface AuthSessionProviderProps {
  children: ReactNode;
}

interface AuthSessionProviderState {
  session: ClientSession | null;
  loading: boolean;
  setSession: (session: ClientSession) => void;
  clearSession: () => void;
}

const AuthSessionContext = createContext<AuthSessionProviderState | undefined>(
  undefined,
);

export function loadSession(): ClientSession | null {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    const parsed = clientSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error("Invalid session data", parsed.error);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (session && !loading) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else if (!loading && !session) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [session, loading]);

  const handleClearSession = useCallback(() => {
    setSession(null);
  }, []);

  const handleSetSession = useCallback(
    (s: ClientSession) => {
      setSession(s);
    },
    [],
  );

  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
    }
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <AuthSessionContext.Provider
      value={{
        session,
        loading,
        setSession: handleSetSession,
        clearSession: handleClearSession,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error(
      "useAuthSession must be used within an AuthSessionProvider",
    );
  }
  useEffect(() => {
    if (typeof window !== "undefined" && Object.hasOwn(window, "pmSession")) {
      // @ts-expect-error - window.pmSession is not typed
      delete window.pmSession;
    }
    Object.defineProperty(window, "pmSession", {
      get: () => context.session,
      set: (value) => context.setSession(value),
      enumerable: true,
      configurable: true,
    });
  }, [context]);
  return context;
}
