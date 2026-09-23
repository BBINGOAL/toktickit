import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../api';

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
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUserState] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((currentUser) => setUser(currentUser))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

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
        <AuthContext.Provider value={{ user, setUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
