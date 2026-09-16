import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  username: string;
  role: 'admin';
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: (pendingAction?: () => void, actionDescription?: string) => void;
  closeLoginModal: () => void;
  requireAuth: (action: () => void, actionDescription?: string) => void;
  pendingActionDescription: string | null;
}

const STORAGE_AUTH_KEY = 'themis_auth_user';

export const ADMIN_CREDENTIALS = {
  username: 'legialoi',
  password: '101   101!@#',
  role: 'admin' as const,
  name: 'Lê Gia Lợi (Admin)',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username === ADMIN_CREDENTIALS.username) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pendingActionDescription, setPendingActionDescription] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const login = (usernameInput: string, passwordInput: string) => {
    const cleanUser = usernameInput.trim();
    // Verify exact admin credentials
    if (cleanUser === ADMIN_CREDENTIALS.username && passwordInput === ADMIN_CREDENTIALS.password) {
      const authUser: AuthUser = {
        username: ADMIN_CREDENTIALS.username,
        role: 'admin',
        name: ADMIN_CREDENTIALS.name,
      };
      setUser(authUser);
      try {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authUser));
      } catch {
        // Ignore write errors
      }

      setIsLoginModalOpen(false);

      // Execute pending action if any
      if (pendingAction) {
        setTimeout(() => {
          try {
            pendingAction();
          } catch (err) {
            console.error('Error executing pending action:', err);
          }
          setPendingAction(null);
          setPendingActionDescription(null);
        }, 100);
      }

      return { success: true };
    }

    return {
      success: false,
      error: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
    };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    } catch {
      // Ignore
    }
    setPendingAction(null);
    setPendingActionDescription(null);
  };

  const openLoginModal = (action?: () => void, actionDescription?: string) => {
    if (action) {
      setPendingAction(() => action);
    }
    setPendingActionDescription(actionDescription || null);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setPendingAction(null);
    setPendingActionDescription(null);
  };

  const requireAuth = (action: () => void, actionDescription?: string) => {
    if (isAuthenticated) {
      action();
    } else {
      openLoginModal(action, actionDescription);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        requireAuth,
        pendingActionDescription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
