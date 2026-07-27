import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  getCurrentUser,
  fetchAuthSession,
  signOut,
} from "aws-amplify/auth";

type AuthContextType = {
  user: string | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
  try {
    const currentUser = await getCurrentUser();
    const session = await fetchAuthSession();

    const email = session.tokens?.idToken?.payload.email as string | undefined;

    setUser(email ?? currentUser.username);
  } catch (err) {
    console.error("Authentication check failed:", err);
    setUser(null);
  } finally {
    setLoading(false);
  }
}

  async function logout() {
  try {
    await signOut();
  } finally {
    setUser(null);
  }
}

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}