import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface LocalUser {
  uid: string;
  emailOrPhone: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  login: (emailOrPhone: string, pass: string) => Promise<void>;
  register: (emailOrPhone: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: { displayName?: string, photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfileData: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const curUid = localStorage.getItem('current_uid');
    if (curUid) {
      const usersRaw = localStorage.getItem('local_users') || '[]';
      try {
        const users = JSON.parse(usersRaw);
        const found = users.find((u: any) => u.uid === curUid);
        if (found) {
          setUser({ uid: found.uid, emailOrPhone: found.emailOrPhone, displayName: found.displayName, photoURL: found.photoURL });
        }
      } catch (e) {
         console.warn("Could not parse local_users", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (emailOrPhone: string, pass: string) => {
    const usersRaw = localStorage.getItem('local_users') || '[]';
    const users = JSON.parse(usersRaw);
    const found = users.find((u: any) => u.emailOrPhone === emailOrPhone && u.pass === pass);
    if (!found) throw new Error('账号或密码错误 (Invalid credentials)');
    localStorage.setItem('current_uid', found.uid);
    setUser({ uid: found.uid, emailOrPhone: found.emailOrPhone, displayName: found.displayName, photoURL: found.photoURL });
  };

  const register = async (emailOrPhone: string, pass: string) => {
    const usersRaw = localStorage.getItem('local_users') || '[]';
    const users = JSON.parse(usersRaw);
    if (users.find((u: any) => u.emailOrPhone === emailOrPhone)) {
      throw new Error('此账号已注册 (Account already exists)');
    }
    const newUser = { uid: 'usr_' + Date.now().toString(), emailOrPhone, pass, displayName: '科研界新星', photoURL: '' };
    users.push(newUser);
    localStorage.setItem('local_users', JSON.stringify(users));
    localStorage.setItem('current_uid', newUser.uid);
    setUser({ uid: newUser.uid, emailOrPhone: newUser.emailOrPhone, displayName: newUser.displayName, photoURL: newUser.photoURL });
  };

  const logout = async () => {
    localStorage.removeItem('current_uid');
    setUser(null);
  };
  
  const updateProfileData = async (updates: { displayName?: string, photoURL?: string }) => {
    if (!user) return;
    const usersRaw = localStorage.getItem('local_users') || '[]';
    const users = JSON.parse(usersRaw);
    const idx = users.findIndex((u: any) => u.uid === user.uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem('local_users', JSON.stringify(users));
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
