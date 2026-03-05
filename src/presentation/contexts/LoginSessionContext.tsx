import React, { createContext, ReactNode, useContext, useState } from "react";

import { PasswordLoginSession } from "@/data/clients/chukyo-shibboleth-http";

interface LoginSessionContextType {
    loginSession: PasswordLoginSession | null;
    setLoginSession: (session: PasswordLoginSession | null) => void;
}

const LoginSessionContext = createContext<LoginSessionContextType | undefined>(undefined);

interface LoginSessionProviderProps {
    children: ReactNode;
}

export const LoginSessionProvider: React.FC<LoginSessionProviderProps> = ({ children }) => {
    const [loginSession, setLoginSession] = useState<PasswordLoginSession | null>(null);

    return (
        <LoginSessionContext.Provider value={{ loginSession, setLoginSession }}>
            {children}
        </LoginSessionContext.Provider>
    );
};

export const useLoginSession = () => {
    const context = useContext(LoginSessionContext);
    if (!context) {
        throw new Error("useLoginSession must be used within a LoginSessionProvider");
    }
    return context;
};
