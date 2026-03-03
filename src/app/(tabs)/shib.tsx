import { useMemo, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import { ALBO_URLS } from "@/common/constants/urls";
import {
    loginWithPasskey,
    loginWithPassword,
    registerPasskeyWithOTP,
    type PasswordLoginSession,
} from "@/data/clients/chukyo-shibboleth-http";
import { type PasskeyCredential } from "@/data/clients/passkey";
import { MainTemplate } from "@/presentation/components/template/main";
import { Button, ButtonText } from "@/presentation/components/ui/button";
import { Card } from "@/presentation/components/ui/card";
import { Text } from "@/presentation/components/ui/text";

const PASSKEY_STORAGE_PREFIX = "umebo-test-passkey";

function passkeyStorageKey(userId: string) {
    return `${PASSKEY_STORAGE_PREFIX}:${userId}`;
}

function maskCredentialId(credentialId: string) {
    if (credentialId.length <= 12) return credentialId;
    return `${credentialId.slice(0, 6)}...${credentialId.slice(-6)}`;
}

type InputRowProps = {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
};

function InputRow({ label, value, onChangeText, placeholder, secureTextEntry }: InputRowProps) {
    return (
        <View className="gap-1.5">
            <Text className="text-[0.875rem] font-medium text-[#626160]">{label}</Text>
            <TextInput
                className="h-[44px] rounded-[14px] border border-[#e1e1e1] bg-[#f9f7f6] px-3 text-[1rem] text-[#1b1a19]"
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#adacaa"
                autoCapitalize="none"
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
}

type ActionButtonProps = {
    title: string;
    loading: boolean;
    disabled?: boolean;
    onPress: () => void;
};

function ActionButton({ title, loading, disabled, onPress }: ActionButtonProps) {
    return (
        <Button disabled={disabled || loading} onPress={onPress}>
            <ButtonText>{loading ? "実行中..." : title}</ButtonText>
        </Button>
    );
}

export default function Shib() {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [displayName, setDisplayName] = useState("umebo");

    const [enterUrl, setEnterUrl] = useState<string>(ALBO_URLS.login);
    const [goalUrl, setGoalUrl] = useState<string>(ALBO_URLS.base);

    const [session, setSession] = useState<PasswordLoginSession | null>(null);
    const [passkey, setPasskey] = useState<PasskeyCredential | null>(null);
    const [cookieNames, setCookieNames] = useState<string[]>([]);
    const [log, setLog] = useState<string>("未実行");

    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);
    const [loadingPasskey, setLoadingPasskey] = useState(false);
    const [loadingStoredPasskey, setLoadingStoredPasskey] = useState(false);

    const canTryPassword = userId.trim().length > 0 && password.length > 0;
    const canRegister = Boolean(session) && otp.length > 0 && displayName.trim().length > 0;
    const canPasskeyLogin =
        userId.trim().length > 0 &&
        password.length > 0 &&
        enterUrl.trim().length > 0 &&
        goalUrl.trim().length > 0 &&
        Boolean(passkey);

    const passkeySummary = useMemo(() => {
        if (!passkey) return "未ロード";
        return `credentialId: ${maskCredentialId(passkey.credentialId)} / signCount: ${passkey.signCount}`;
    }, [passkey]);

    const handlePasswordLogin = async () => {
        try {
            setLoadingPassword(true);
            setLog("ID/PWログインを開始...");
            if (__DEV__) {
                console.log("[ShibTest] handlePasswordLogin:start", {
                    userId: userId.trim(),
                    passwordLength: password.length,
                });
            }
            const nextSession = await loginWithPassword(userId.trim(), password);
            setSession(nextSession);
            setLog("ID/PWログイン成功。OTP入力待ちです。");
            if (__DEV__) {
                console.log("[ShibTest] handlePasswordLogin:success", {
                    authStateLength: nextSession.authState.length,
                    username: nextSession.username,
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "ID/PWログインに失敗しました";
            setLog(message);
            setSession(null);
            if (__DEV__) {
                console.log("[ShibTest] handlePasswordLogin:error", {
                    message,
                    error,
                });
            }
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleRegisterPasskey = async () => {
        if (!session) return;
        try {
            setLoadingRegister(true);
            setLog("OTP認証 + パスキー登録を開始...");
            const createdPasskey = await registerPasskeyWithOTP(session, otp, displayName.trim());
            await SecureStore.setItemAsync(passkeyStorageKey(session.username), JSON.stringify(createdPasskey));
            setPasskey(createdPasskey);
            setLog("パスキー登録成功。SecureStoreに保存しました。");
        } catch (error) {
            const message = error instanceof Error ? error.message : "パスキー登録に失敗しました";
            setLog(message);
        } finally {
            setLoadingRegister(false);
        }
    };

    const handleLoadPasskey = async () => {
        try {
            setLoadingStoredPasskey(true);
            const saved = await SecureStore.getItemAsync(passkeyStorageKey(userId.trim()));
            if (!saved) {
                setPasskey(null);
                setLog("保存済みパスキーが見つかりません");
                return;
            }
            const parsed = JSON.parse(saved) as PasskeyCredential;
            setPasskey(parsed);
            setLog("保存済みパスキーを読み込みました");
        } catch {
            setPasskey(null);
            setLog("保存済みパスキーの読み込みに失敗しました");
        } finally {
            setLoadingStoredPasskey(false);
        }
    };

    const handlePasskeyLogin = async () => {
        if (!passkey) return;

        try {
            setLoadingPasskey(true);
            setLog("パスキーログインを開始...");
            const cookies = await loginWithPasskey(
                {
                    enterUrl: enterUrl.trim(),
                    goalUrl: goalUrl.trim(),
                    userId: userId.trim(),
                    password,
                },
                passkey
            );

            await SecureStore.setItemAsync(passkeyStorageKey(userId.trim()), JSON.stringify(passkey));

            const names = Object.keys(cookies);
            setCookieNames(names);
            setLog(`パスキーログイン成功。Cookie数: ${names.length}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "パスキーログインに失敗しました";
            setCookieNames([]);
            setLog(message);
        } finally {
            setLoadingPasskey(false);
        }
    };

    return (
        <MainTemplate title="Shibbolethテスト" subtitle="ID/PW・OTP登録・Passkey認証を順番に確認できます">
            <View className="mx-3 mb-6 gap-4">
                <Card variant="outline" className="gap-3 p-3">
                    <Text className="text-[1rem] font-bold text-[#1b1a19]">1. 基本情報</Text>
                    <InputRow label="学籍番号" value={userId} onChangeText={setUserId} placeholder="1234567890" />
                    <InputRow
                        label="パスワード"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="password"
                        secureTextEntry
                    />
                    <InputRow label="表示名" value={displayName} onChangeText={setDisplayName} placeholder="umebo" />
                    <ActionButton
                        title="ID/PWでログイン（OTP待ち）"
                        loading={loadingPassword}
                        disabled={!canTryPassword}
                        onPress={handlePasswordLogin}
                    />
                    <Text className="text-[0.875rem] text-[#626160]">
                        {session ? `AuthState取得済み: ${session.authState}` : "AuthState未取得"}
                    </Text>
                </Card>

                <Card variant="outline" className="gap-3 p-3">
                    <Text className="text-[1rem] font-bold text-[#1b1a19]">2. OTPでパスキー登録</Text>
                    <InputRow label="OTP" value={otp} onChangeText={setOtp} placeholder="123456" />
                    <ActionButton
                        title="OTP認証 + パスキー登録"
                        loading={loadingRegister}
                        disabled={!canRegister}
                        onPress={handleRegisterPasskey}
                    />
                    <View className="gap-2">
                        <ActionButton
                            title="保存済みパスキーを読み込む"
                            loading={loadingStoredPasskey}
                            disabled={userId.trim().length === 0}
                            onPress={handleLoadPasskey}
                        />
                        <Text className="text-[0.875rem] text-[#626160]">{passkeySummary}</Text>
                    </View>
                </Card>

                <Card variant="outline" className="gap-3 p-3">
                    <Text className="text-[1rem] font-bold text-[#1b1a19]">3. 保存済みパスキーでログイン</Text>
                    <InputRow label="enterUrl" value={enterUrl} onChangeText={setEnterUrl} />
                    <InputRow label="goalUrl" value={goalUrl} onChangeText={setGoalUrl} />
                    <ActionButton
                        title="パスキーログイン実行"
                        loading={loadingPasskey}
                        disabled={!canPasskeyLogin}
                        onPress={handlePasskeyLogin}
                    />
                    <Text className="text-[0.875rem] text-[#626160]">
                        {cookieNames.length > 0 ? `Cookie: ${cookieNames.join(", ")}` : "Cookie未取得"}
                    </Text>
                </Card>

                <Card variant="outline" className="gap-2 p-3">
                    <Text className="text-[1rem] font-bold text-[#1b1a19]">実行ログ</Text>
                    <View className="min-h-[56px] rounded-[14px] bg-[#f9f7f6] px-3 py-2">
                        <Text className="text-[0.875rem] text-[#1b1a19]">{log}</Text>
                    </View>
                    {(loadingPassword || loadingRegister || loadingPasskey || loadingStoredPasskey) && (
                        <View className="flex-row items-center gap-2">
                            <ActivityIndicator size="small" color="#2e6bff" />
                            <Text className="text-[0.875rem] text-[#626160]">通信中...</Text>
                        </View>
                    )}
                </Card>
            </View>
        </MainTemplate>
    );
}
