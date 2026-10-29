"use client";

import { ProfileData } from "@/lib/dtos";
import { createContext, useContext, useState } from "react";

type User = {
    id: string;
    fullName: string;
    phoneNumber: string;
    countryCode: string;
    imageUrl: string | null;
    email: string;
};

type AuthContextType = {
    token: string | null;
    role: string[] | null;
    user: User | null;
    profileData:ProfileData | null

    setToken: (token: string | null) => void;
    setRole: (role: string[] | null) => void;
    setUser: (user: User | null) => void;
    setProfileData: (profileData: ProfileData | null) => void;
};

const AuthContext = createContext<AuthContextType>({
    token: null,
    role: null,
    user: null,
    profileData: null,

    setToken: () => { },
    setRole: () => { },
    setUser: () => { },
    setProfileData: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({
    children,
    initialToken,
    initialRole,
    initialUser,

}: {
    children: React.ReactNode;
    initialToken: string | null;
    initialRole: string[] | null;
    initialUser: User | null;

}) => {
    const [token, setToken] = useState<string | null>(initialToken);
    const [role, setRole] = useState<string[] | null>(initialRole);
    const [user, setUser] = useState<User | null>(initialUser);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    return (
        <AuthContext.Provider
            value={{
                token,
                role,
                user,
                profileData,
                setToken,
                setRole,
                setUser,
                setProfileData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};