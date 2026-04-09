"use client";

import { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

type AuthContextType = {
  isAuthenticated: boolean;
  userId?: string;
  role?: "COACH" | "CLIENT";
};

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSession();

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!data?.user,
        userId: data?.user?.id,
        role: data?.user?.role
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
