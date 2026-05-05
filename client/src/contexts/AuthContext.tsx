import React, { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "therapist" | "clinician" | "admin" | "patient";
  institution: string;
  patientId?: string; // only for patient role
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "u1",
    name: "Dr. Erisa",
    email: "erisa@axonai.com",
    password: "demo123",
    role: "therapist",
    institution: "King's College Hospital NHS",
  },
  {
    id: "u2",
    name: "Dr. James Okafor",
    email: "j.okafor@imperial.nhs.uk",
    password: "demo123",
    role: "clinician",
    institution: "Imperial College Healthcare NHS Trust",
  },
  // Patient demo accounts
  {
    id: "p1",
    name: "James Thornton",
    email: "james@axonai.com",
    password: "demo123",
    role: "patient",
    institution: "King's College Hospital NHS",
    patientId: "PT-001",
  },
  {
    id: "p2",
    name: "Margaret Ellis",
    email: "margaret@axonai.com",
    password: "demo123",
    role: "patient",
    institution: "King's College Hospital NHS",
    patientId: "PT-002",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("axonai_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      const { password: _pw, ...userData } = found;
      setUser(userData);
      sessionStorage.setItem("axonai_user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("axonai_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
