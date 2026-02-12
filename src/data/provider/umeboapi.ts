import { UMEBO_API_BASE_URL } from "@/constants";
import { httpClient } from "../clients/httpClient";

class UMEBOAPIProvider {
    public async login(bearerToken: string): Promise<Response> {
        return httpClient(`${UMEBO_API_BASE_URL}/v1/auth/login`, {
            clientMode: "umeboapi",
            method: "POST",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    }
}

export const umeboapiProvider = new UMEBOAPIProvider();
