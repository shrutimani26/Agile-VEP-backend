/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { setAuthToken } from "@/api/api.service";

type TUserProfile = {
    id: number;
    email: string;
    name: string;
    phone: string;
    maskedId: string;
    role: string;
};

type UserContextType = {
    user: TUserProfile | null;
    token: string | null;
    registerUser: (
        email: string,
        password: string,
        full_name: string,
        phone_number: string,
        nric_passport: string
    ) => Promise<void>;
    loginUser: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    isLoggedIn: () => boolean;
};

export const UserContext = createContext<UserContextType>(
    {} as UserContextType
);

axios.defaults.baseURL = "http://localhost:5000/api/v1";
axios.defaults.withCredentials = true; // required for refresh cookie

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<TUserProfile | null>(null);
    const [isReady, setIsReady] = useState(false);

    // 🔥 On app start → try refresh token
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const res = await axios.post("/auth/refresh-token");
                const newToken = res.data.token;

                setToken(newToken);
                axios.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${newToken}`;
                setAuthToken(newToken);
                const userRes = await axios.get("/auth/me");
                console.log(userRes.data.user)
                setUser(userRes.data.user);
            } catch {
                // silently fail if no refresh token
            } finally {
                setIsReady(true);
            }
        };

        initializeAuth();
    }, []);

    // 🔹 Register
    const registerUser = async (
        email: string,
        password: string,
        full_name: string,
        phone_number: string,
        nric_passport: string
    ) => {
        try {
            await axios.post("/auth/register", {
                email,
                password,
                full_name,
                phone_number,
                nric_passport,
            });

            alert("Registration successful!");
        } catch (error: any) {
            alert(error.response?.data?.error || "Registration failed");
        }
    };

    // 🔹 Login
    const loginUser = async (email: string, password: string) => {
    try {
        const res = await axios.post("/auth/login", { email, password });
        const { token, user } = res.data;

        setToken(token);
        setUser(user);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setAuthToken(token);

        return user; // ← make sure this is here
    } catch (error: any) {
        throw error; // ← change alert() to throw so Login.tsx can catch it
    }
    };

    // 🔹 Logout
    const logout = async () => {
        try {
            await axios.post("/auth/logout");
        } catch { }

        delete axios.defaults.headers.common["Authorization"];
        setAuthToken(null);
        setUser(null);
        setToken(null);

    };

    const isLoggedIn = () => !!user;

    return (
        <UserContext.Provider
            value={{ user, token, registerUser, loginUser, logout, isLoggedIn }}
        >
            {isReady ? children : null}
        </UserContext.Provider>
    );
};
