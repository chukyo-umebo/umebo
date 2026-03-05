import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { authService, LoginStep } from "@/domain/services/auth";

interface AuthStateContextType {
    loginStep: LoginStep;
    login: () => void;
    logout: () => void;
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);

// React外から認証状態を更新するためのグローバル関数
let globalSetLoginStep: ((loginStep: LoginStep) => void) | null = null;

export const updateAuthState = (loginStep: LoginStep) => {
    if (globalSetLoginStep) {
        globalSetLoginStep(loginStep);
    }
};

interface AuthStateProviderProps {
    children: ReactNode;
}

export const AuthStateProvider: React.FC<AuthStateProviderProps> = ({ children }) => {
    const [loginStep, setLoginStep] = useState<LoginStep>(LoginStep.NotLoggedIn);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // グローバル関数に状態更新関数を登録
    useEffect(() => {
        globalSetLoginStep = setLoginStep;
        return () => {
            globalSetLoginStep = null;
        };
    }, []);

    // 初期ログイン状態の確認
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const loginStep = await authService.getLoginStep();
                setLoginStep(loginStep);
            } catch (error) {
                console.error("Failed to check login status:", error);
                setLoginStep(LoginStep.NotLoggedIn);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    const login = () => {
        updateAuthState(LoginStep.LoggedIn);
    };

    const logout = () => {
        updateAuthState(LoginStep.NotLoggedIn);
    };

    // 初期ロード中は何も表示しない（または Loading コンポーネントを表示）
    if (isLoading) {
        return null;
    }

    return <AuthStateContext.Provider value={{ loginStep, login, logout }}>{children}</AuthStateContext.Provider>;
};

export const useAuthState = () => {
    const context = useContext(AuthStateContext);
    if (!context) {
        throw new Error("useAuthState must be used within an AuthStateProvider");
    }
    return context;
};
