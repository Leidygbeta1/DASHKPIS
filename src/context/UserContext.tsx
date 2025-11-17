import React, { createContext, useContext, useState, useEffect } from "react";
import { CurrentUser, getCurrentUser } from "../services/session";

type UserContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  refreshUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(getCurrentUser());
  const refreshUser = () => {
    setUser(getCurrentUser());
  };
  useEffect(() => {
    refreshUser();
  }, []);
  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de <UserProvider>");
  return ctx;
}
