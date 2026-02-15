import { UMEBO_API_URLS } from "@/common/constants/urls";
import { httpClient, HttpClientOptions } from "../clients/httpClient";

class UMEBOAPIProvider {
    private async fetch(path: string, options: HttpClientOptions & { firebaseIdToken?: string }): Promise<string> {
        const { firebaseIdToken, headers, ...httpOptions } = options || {};
        const response = await httpClient(`${UMEBO_API_URLS.base}${path}`, {
            clientMode: "umeboapi",
            headers: {
                ...headers,
                ...(firebaseIdToken ? { Authentication: `Bearer ${firebaseIdToken}` } : {}),
            },
            ...httpOptions,
        });
        return await response.text();
    }

    public async login(firebaseIdToken: string): Promise<string> {
        return this.fetch("/auth/login", {
            method: "POST",
            firebaseIdToken,
        });
    }
}

export const umeboapiProvider = new UMEBOAPIProvider();
