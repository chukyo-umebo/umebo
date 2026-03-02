import React, { useCallback, useRef, useState } from "react";
import { Alert, TextInput as RNTextInput, View } from "react-native";

import { ALBO_URLS, CHUKYO_SHIBBOLETH_URLS } from "@/common/constants/urls";
import {
    authenticateWithPasskey,
    authenticateWithPassword,
    registerPasskeyWithOtp,
    type PasskeyCredential,
    type PasswordAuthResult,
    type ServiceCookies,
} from "@/data/clients/chukyo-shibboleth-passkey";
import { MainTemplate } from "@/presentation/components/template/main";
import { Button, ButtonText } from "@/presentation/components/ui/button";
import { Text } from "@/presentation/components/ui/text";

// ============================================
// 状態の型
// ============================================

type Phase =
    | { kind: "idle" }
    | { kind: "waitingOtp"; authResult: PasswordAuthResult }
    | { kind: "registered"; credential: PasskeyCredential }
    | { kind: "loggedIn"; cookies: ServiceCookies };

// ============================================
// テスト画面
// ============================================

export default function ShibbolethTestScreen() {
    // --- 入力 ---
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [displayName, setDisplayName] = useState("umebo");

    // --- 処理状態 ---
    const [phase, setPhase] = useState<Phase>({ kind: "idle" });
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    // --- パスキー情報の保持 ---
    const credentialRef = useRef<PasskeyCredential | null>(null);

    const appendLog = useCallback((msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLog((prev) => [...prev, `[${timestamp}] ${msg}`]);
    }, []);

    // -----------------------------------------------
    // Step 1: ID/PW で一次認証 → OTP 入力待ちへ
    // -----------------------------------------------
    const handlePasswordAuth = useCallback(async () => {
        if (!userId || !password) {
            Alert.alert("入力エラー", "ユーザーIDとパスワードを入力してください");
            return;
        }

        setLoading(true);
        setLog([]);
        appendLog("ID/PW 認証を開始...");

        try {
            const result = await authenticateWithPassword(CHUKYO_SHIBBOLETH_URLS.clspLogin, userId, password);

            appendLog("一次認証成功 — OTP を入力してください");
            setPhase({ kind: "waitingOtp", authResult: result });
        } catch (error) {
            appendLog(`認証失敗: ${error instanceof Error ? error.message : String(error)}`);
            Alert.alert("認証エラー", error instanceof Error ? error.message : "不明なエラー");
        } finally {
            setLoading(false);
        }
    }, [userId, password, appendLog]);

    // -----------------------------------------------
    // Step 2: OTP を入力して擬似パスキーを登録
    // -----------------------------------------------
    const handleRegisterPasskey = useCallback(async () => {
        if (phase.kind !== "waitingOtp") return;
        if (!otp) {
            Alert.alert("入力エラー", "OTP を入力してください");
            return;
        }

        setLoading(true);
        appendLog("OTP 送信 & パスキー登録を開始...");

        try {
            const credential = await registerPasskeyWithOtp(phase.authResult, otp, displayName || "umebo");

            credentialRef.current = credential;
            appendLog(`パスキー登録成功!`);
            appendLog(`  credentialId: ${credential.credentialId.substring(0, 20)}...`);
            appendLog(`  rpId: ${credential.rpId}`);
            appendLog(`  userId: ${credential.userId}`);
            appendLog(`  displayName: ${credential.displayName}`);
            setPhase({ kind: "registered", credential });
        } catch (error) {
            appendLog(`登録失敗: ${error instanceof Error ? error.message : String(error)}`);
            Alert.alert("登録エラー", error instanceof Error ? error.message : "不明なエラー");
        } finally {
            setLoading(false);
        }
    }, [phase, otp, displayName, appendLog]);

    // -----------------------------------------------
    // Step 3: パスキーでログイン
    // -----------------------------------------------
    const handlePasskeyLogin = useCallback(async () => {
        const credential = credentialRef.current;
        if (!credential) {
            Alert.alert("エラー", "パスキーが登録されていません");
            return;
        }
        if (!password) {
            Alert.alert("入力エラー", "パスワードを入力してください（パスキーログインにも必要です）");
            return;
        }

        setLoading(true);
        appendLog("パスキーでログインを開始...");

        try {
            const cookies = await authenticateWithPasskey(
                ALBO_URLS.login, // enterUrl: Albo の SAML ログイン
                ALBO_URLS.base + "/dashboard", // goalUrl: ダッシュボード
                credential,
                password
            );

            appendLog("パスキーログイン成功!");
            appendLog(`取得クッキー: ${Object.keys(cookies).join(", ")}`);
            setPhase({ kind: "loggedIn", cookies });
        } catch (error) {
            appendLog(`ログイン失敗: ${error instanceof Error ? error.message : String(error)}`);
            Alert.alert("ログインエラー", error instanceof Error ? error.message : "不明なエラー");
        } finally {
            setLoading(false);
        }
    }, [password, appendLog]);

    // -----------------------------------------------
    // リセット
    // -----------------------------------------------
    const handleReset = useCallback(() => {
        setPhase({ kind: "idle" });
        setOtp("");
        setLog([]);
    }, []);

    return (
        <MainTemplate title="Shibboleth テスト" subtitle="疑似パスキー認証のデモ">
            <View className="gap-4 p-4">
                {/* ===== ID / PW 入力 ===== */}
                <View className="gap-2">
                    <Text className="text-base font-bold">ユーザーID</Text>
                    <RNTextInput
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                        placeholder="例: t324076"
                        value={userId}
                        onChangeText={setUserId}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View className="gap-2">
                    <Text className="text-base font-bold">パスワード</Text>
                    <RNTextInput
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                        placeholder="パスワード"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* ===== Step 1: ID/PW 認証ボタン ===== */}
                {phase.kind === "idle" && (
                    <Button onPress={handlePasswordAuth} disabled={loading}>
                        <ButtonText>{loading ? "認証中..." : "Step 1: ID/PW で認証"}</ButtonText>
                    </Button>
                )}

                {/* ===== Step 2: OTP 入力 & パスキー登録 ===== */}
                {phase.kind === "waitingOtp" && (
                    <View className="gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <Text className="text-base font-bold text-blue-800">OTP 入力 & パスキー登録</Text>

                        <View className="gap-2">
                            <Text className="text-sm">メールに届いた OTP を入力</Text>
                            <RNTextInput
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                                placeholder="例: 012345"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                autoFocus
                            />
                        </View>

                        <View className="gap-2">
                            <Text className="text-sm">パスキーの表示名</Text>
                            <RNTextInput
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                                placeholder="umebo"
                                value={displayName}
                                onChangeText={setDisplayName}
                            />
                        </View>

                        <Button onPress={handleRegisterPasskey} disabled={loading}>
                            <ButtonText>{loading ? "登録中..." : "Step 2: OTP で認証 & パスキー登録"}</ButtonText>
                        </Button>
                    </View>
                )}

                {/* ===== Step 3: パスキーでログイン ===== */}
                {(phase.kind === "registered" || phase.kind === "loggedIn") && (
                    <View className="gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <Text className="text-base font-bold text-green-800">パスキー登録済み</Text>
                        <Text className="text-sm text-green-700">
                            credentialId: {credentialRef.current?.credentialId.substring(0, 24)}...
                        </Text>

                        <Button onPress={handlePasskeyLogin} disabled={loading}>
                            <ButtonText>{loading ? "ログイン中..." : "Step 3: パスキーで Albo にログイン"}</ButtonText>
                        </Button>
                    </View>
                )}

                {/* ===== ログイン結果 ===== */}
                {phase.kind === "loggedIn" && (
                    <View className="gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <Text className="text-base font-bold text-emerald-800">ログイン成功</Text>
                        {Object.entries(phase.cookies).map(([name, value]) => (
                            <Text key={name} className="text-xs text-emerald-700">
                                {name}: {String(value).substring(0, 30)}...
                            </Text>
                        ))}
                    </View>
                )}

                {/* ===== リセット ===== */}
                {phase.kind !== "idle" && (
                    <Button onPress={handleReset}>
                        <ButtonText>リセット</ButtonText>
                    </Button>
                )}

                {/* ===== ログ出力 ===== */}
                {log.length > 0 && (
                    <View className="gap-1 rounded-xl bg-gray-900 p-4">
                        <Text className="mb-2 text-sm font-bold text-gray-300">ログ</Text>
                        {log.map((line, i) => (
                            <Text key={i} className="text-xs text-gray-400">
                                {line}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        </MainTemplate>
    );
}
