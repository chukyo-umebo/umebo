import {
    fetchAndActivate as fb_fetchAndActivate,
    getRemoteConfig,
    setDefaults,
} from "@react-native-firebase/remote-config";

export class RemoteConfigProvider {
    /**
     * Firebase Remote Configから最新の設定を取得し、アプリケーションに反映させます。
     */
    async fetchAndActivate(): Promise<void> {
        const remoteConfig = getRemoteConfig();

        await setDefaults(remoteConfig, {
            // admin
            maintenanceMode: false,
            minimumVersion: "0.0.0",

            // auth
            allowedMailDomain: "m.chukyo-u.ac.jp",
            webClientId: "293922024536-gji1lfv0ij6m36posdfodh5k3n79260n.apps.googleusercontent.com",
        });

        const fetchedRemotely = await fb_fetchAndActivate(remoteConfig);
        if (fetchedRemotely) {
            console.log("[Firebase Remote Config] firebaseから設定を取得して有効化しました。");
        } else {
            console.warn("[Firebase Remote Config] firebaseから設定を取得できず、ローカルの設定が有効化されています。");
        }
    }
}

export const remoteConfigProvider = new RemoteConfigProvider();
