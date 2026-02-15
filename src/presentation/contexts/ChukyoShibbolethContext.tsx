import React, { createContext, ReactNode, RefObject, useCallback, useContext } from "react";
import { Cookies } from "@react-native-cookies/cookies";

import { Credential, shibbolethWebViewRef } from "@/data/clients/chukyo-shibboleth";

interface ChukyoShibbolethContextType {
    chukyoShibbolethAuth: (crd: Credential) => Promise<Cookies>;
}

const ChukyoShibbolethContext = createContext<ChukyoShibbolethContextType | undefined>(undefined);

export const useChukyoShibboleth = () => {
    const context = useContext(ChukyoShibbolethContext);
    if (!context) {
        throw new Error("useChukyoShibboleth must be used within a ChukyoShibbolethProvider");
    }
    return context;
};

interface ChukyoShibbolethProviderProps {
    children: ReactNode;
    authRef: RefObject<shibbolethWebViewRef | null>;
}

export const ChukyoShibbolethProvider = ({ children, authRef }: ChukyoShibbolethProviderProps) => {
    const chukyoShibbolethAuth = useCallback(
        async (crd: Credential) => {
            if (!authRef.current) {
                throw new Error("Authentication module is not initialized");
            }
            return authRef.current.chukyoShibbolethAuth(crd);
        },
        [authRef]
    );

    return (
        <ChukyoShibbolethContext.Provider value={{ chukyoShibbolethAuth }}>{children}</ChukyoShibbolethContext.Provider>
    );
};
