"use client";

import { createContext, useContext, ReactNode } from 'react';
import { Auth0Provider, useUser } from '@auth0/nextjs-auth0/client';

interface InternalUser {
  id: string;
  email: string;
  tier: string;
  isVerified: boolean;
  userType: 'INDIVIDUAL' | 'ORGANIZATION';
  isVerifiedOrg: boolean;
  subscriptionTier: string;
}

interface AuthContextType {
  user: InternalUser | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthBridge({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  // Bridge Auth0 user to our internal user structure
  const internalUser: InternalUser | null = user ? {
    id: user.sub as string,
    email: user.email as string,
    tier: (user.subscription_tier as string) || "Free",
    isVerified: !!user.email_verified,
    userType: (user.user_type as 'INDIVIDUAL' | 'ORGANIZATION') || 'INDIVIDUAL',
    isVerifiedOrg: !!user.is_verified_org,
    subscriptionTier: (user.subscription_tier as string) || "Free"
  } : null;

  // We'll get the token later from the server side or a separate call if needed, 
  // but for the UI, the session cookie is enough for most cases.
  const token = null; 

  const login = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <AuthContext.Provider value={{ user: internalUser, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <AuthBridge>
        {children}
      </AuthBridge>
    </Auth0Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
