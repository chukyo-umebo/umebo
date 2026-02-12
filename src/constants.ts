function devHelper(devValue: string | undefined, prodValue: string): string {
    if (__DEV__) {
        if (typeof devValue === "undefined") {
            return prodValue;
        }
        return devValue;
    } else {
        return prodValue;
    }
}

export const UMEBO_API_BASE_URL = devHelper(process.env.EXPO_PUBLIC_UMEBO_API_BASE_URL, "https://api.ume.bo/v1");
