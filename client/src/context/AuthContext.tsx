import React, { createContext, useContext, useState, useEffect } from 'react';

export type User = {
    id: number;
    name: string;
    role: string;
    mustChangePassword?: boolean;
} | null;

interface AuthContextType {
    user: User;
    setUser: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // In a full implementation, you would have a /api/auth/me endpoint 
    // to fetch the current user session on load using the cookie.
    // For this lab, we'll store user in localStorage to persist across reloads
    // (the token is in the HttpOnly cookie, but UI state is here).
    const [user, setUserState] = useState<User>(() => {
        const saved = localStorage.getItem('toktickit_user');
        return saved ? JSON.parse(saved) : null;
    });

    const setUser = (newUser: User) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem('toktickit_user', JSON.stringify(newUser));
        } else {
            localStorage.removeItem('toktickit_user');
        }
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
