import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { authRepository } from "@/data/repositories/auth";

interface AuthStateContextType {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);

// React外から認証状態を更新するためのグローバル関数
let globalSetIsLoggedIn: ((isLoggedIn: boolean) => void) | null = null;

export const updateAuthState = (isLoggedIn: boolean) => {
    if (globalSetIsLoggedIn) {
        globalSetIsLoggedIn(isLoggedIn);
    }
};

interface AuthStateProviderProps {
    children: ReactNode;
}

export const AuthStateProvider: React.FC<AuthStateProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // グローバル関数に状態更新関数を登録
    useEffect(() => {
        globalSetIsLoggedIn = setIsLoggedIn;
        return () => {
            globalSetIsLoggedIn = null;
        };
    }, []);

    // 初期ログイン状態の確認
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                setIsLoggedIn(await authRepository.isLoggedIn());
            } catch (error) {
                console.error("Failed to check login status:", error);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    const login = () => {
        setIsLoggedIn(true);
    };

    const logout = () => {
        setIsLoggedIn(false);
    };

    // 初期ロード中は何も表示しない（または Loading コンポーネントを表示）
    if (isLoading) {
        return null;
    }

    return <AuthStateContext.Provider value={{ isLoggedIn, login, logout }}>{children}</AuthStateContext.Provider>;
};

export const useAuthState = () => {
    const context = useContext(AuthStateContext);
    if (!context) {
        throw new Error("useAuthState must be used within an AuthStateProvider");
    }
    return context;
};
