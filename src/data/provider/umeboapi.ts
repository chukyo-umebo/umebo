import { UMEBO_API_BASE_URL } from "@/constants";
import { httpClient } from "../clients/httpClient";

class UMEBOAPIProvider {
    public async login(bearerToken: string): Promise<void> {
        const response = await httpClient(`${UMEBO_API_BASE_URL}/auth/login`, {
            clientMode: "umeboapi",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
        if (!response.ok) {
            throw new Error("UMEBO APIへのログインに失敗しました。");
        }
        return await response.json();
    }
}

export const umeboapiProvider = new UMEBOAPIProvider();
