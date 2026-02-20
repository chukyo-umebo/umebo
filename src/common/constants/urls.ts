import { Platform } from "react-native";





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

/**
 * アプリケーション全体で使用するURLを一元管理
 */

// ============================================
// PassPal公式サイト関連
// ============================================
export const PASSPAL_URLS = {
    /** フィードバックフォーム */
    feedback: "https://chukyo-passpal.app/feedback",
    /** お問い合わせフォーム */
    contact: "https://chukyo-passpal.app/contact",
    /** 利用規約 */
    terms: "https://chukyo-passpal.app/term",
    /** プライバシーポリシー */
    privacy: "https://chukyo-passpal.app/policy",
} as const;

// ============================================
// UMEBOバックエンド関連
// ============================================
export const UMEBO_API_URLS = {
    /** ベースURL */
    base: devHelper(process.env.EXPO_PUBLIC_UMEBO_API_BASE_URL, "https://api.chukyo-passpal.app"),
} as const;

// ============================================
// ChukyoLinkバックエンド関連
// ============================================
export const ChukyoLink_URLS = {
    /** ベースURL */
    base: "https://link.lanet.sist.chukyo-u.ac.jp",
} as const;

// ============================================
// アプリストア関連
// ============================================
export const STORE_URLS = {
    /** iOS App Store */
    ios: "https://apps.apple.com/app/passpal/id6754452343",
    /** Google Play Store */
    android: "https://play.google.com/store/apps/details?id=app.chukyopasspal.passpal",

    device: () => (Platform.OS === "ios" ? STORE_URLS.ios : STORE_URLS.android),
} as const;

// ============================================
// 中京大学サービス関連
// ============================================

/** CUBICS（授業支援システム）関連URL */
export const CUBICS_URLS = {
    /** ベースURL */
    base: "https://cubics-as-out.mng.chukyo-u.ac.jp",
} as const;

/** Albo（ポータルサイト）関連URL */
export const ALBO_URLS = {
    /** ベースURL */
    base: "https://albo.chukyo-u.ac.jp",
    /** ログインURL */
    login: "https://albo.chukyo-u.ac.jp/api/saml/login",
} as const;

/** MaNaBo（学習管理システム）関連URL */
export const MANABO_URLS = {
    /** ベースURL */
    base: "https://manabo.cnc.chukyo-u.ac.jp",
    /** Shibboleth認証URL */
    auth: "https://manabo.cnc.chukyo-u.ac.jp/auth/shibboleth/",
    /**
     * 授業ページURLを生成
     * @param classId - 授業ID
     * @returns 授業ページのURL
     */
    class: (classId: string) => `https://manabo.cnc.chukyo-u.ac.jp/class/${classId}/`,
} as const;

/** 中京大学Shibboleth（認証システム）関連URL */
export const CHUKYO_SHIBBOLETH_URLS = {
    /** ログインフォームURL */
    loginForm: "https://shib.chukyo-u.ac.jp/cloudlink/module.php/core/loginuserpass.php",
} as const;

/** 中京大学のリンク集 */
export const CHUKYO_UNIVERSITY_LINKS = {
    /** m.mail */
    mMail: "https://mail.google.com/a/m.chukyo-u.ac.jp",
    /** 豊田キャンパスマップ */
    toyotaCampusMap: "https://www.chukyo-u.ac.jp/information/facility/g2.html",
    /** 名古屋キャンパスマップ */
    nagoyaCampusMap: "https://www.chukyo-u.ac.jp/information/facility/g1.html",
};
