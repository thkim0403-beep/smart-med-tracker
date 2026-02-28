import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// WebBrowser warm up for faster auth
WebBrowser.maybeCompleteAuthSession();

// Storage keys
const AUTH_TOKEN_KEY = "@smart_med_tracker:auth_token";
const USER_INFO_KEY = "@smart_med_tracker:user_info";

// User info interface
export interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider: "google" | "naver" | "apple";
}

export interface AuthResult {
    success: boolean;
    user?: UserInfo;
    error?: string;
}

// Google OAuth Configuration
// Set these in your .env file as EXPO_PUBLIC_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: "smart-med-tracker",
});

// Naver OAuth Configuration
// Set these in your .env file as EXPO_PUBLIC_NAVER_CLIENT_ID and EXPO_PUBLIC_NAVER_CLIENT_SECRET
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || "YOUR_NAVER_CLIENT_ID";
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || "YOUR_NAVER_CLIENT_SECRET";
const NAVER_REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: "smart-med-tracker",
});


/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
    try {
        const discovery = {
            authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenEndpoint: "https://oauth2.googleapis.com/token",
            revocationEndpoint: "https://oauth2.googleapis.com/revoke",
        };

        const codeVerifier = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            Math.random().toString() + Date.now().toString()
        );

        const request = new AuthSession.AuthRequest({
            clientId: GOOGLE_CLIENT_ID,
            scopes: ["openid", "profile", "email"],
            redirectUri: GOOGLE_REDIRECT_URI,
            codeChallenge: codeVerifier,
            usePKCE: true,
        });

        const result = await request.promptAsync(discovery);

        if (result.type === "success" && result.params.code) {
            // Exchange code for token
            const tokenResponse = await fetch(discovery.tokenEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    code: result.params.code,
                    redirect_uri: GOOGLE_REDIRECT_URI,
                    grant_type: "authorization_code",
                    code_verifier: request.codeVerifier || "",
                }).toString(),
            });

            const tokenData = await tokenResponse.json();

            if (tokenData.access_token) {
                // Get user info
                const userInfo = await getGoogleUserInfo(tokenData.access_token);

                // Store auth data
                await AsyncStorage.setItem(AUTH_TOKEN_KEY, tokenData.access_token);
                await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

                return { success: true, user: userInfo };
            }
        }

        if (result.type === "cancel") {
            return { success: false, error: "사용자가 로그인을 취소했습니다." };
        }

        return { success: false, error: "Google 로그인에 실패했습니다." };
    } catch (error) {
        console.error("Google sign in error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Google 로그인 중 오류가 발생했습니다.",
        };
    }
}

/**
 * Get Google user info from access token
 */
async function getGoogleUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    return {
        id: data.sub,
        email: data.email,
        name: data.name,
        picture: data.picture,
        provider: "google",
    };
}

/**
 * Sign in with Naver OAuth
 */
export async function signInWithNaver(): Promise<AuthResult> {
    try {
        const state = Math.random().toString(36).substring(7);

        const authUrl =
            `https://nid.naver.com/oauth2.0/authorize?` +
            `response_type=code` +
            `&client_id=${NAVER_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(NAVER_REDIRECT_URI)}` +
            `&state=${state}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, NAVER_REDIRECT_URI);

        if (result.type === "success" && result.url) {
            const url = new URL(result.url);
            const code = url.searchParams.get("code");
            const returnedState = url.searchParams.get("state");

            if (code && returnedState === state) {
                // Exchange code for token
                const tokenResponse = await fetch(
                    `https://nid.naver.com/oauth2.0/token?` +
                    `grant_type=authorization_code` +
                    `&client_id=${NAVER_CLIENT_ID}` +
                    `&client_secret=${NAVER_CLIENT_SECRET}` +
                    `&code=${code}` +
                    `&state=${state}`
                );

                const tokenData = await tokenResponse.json();

                if (tokenData.access_token) {
                    // Get user info
                    const userInfo = await getNaverUserInfo(tokenData.access_token);

                    // Store auth data
                    await AsyncStorage.setItem(AUTH_TOKEN_KEY, tokenData.access_token);
                    await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

                    return { success: true, user: userInfo };
                }
            }
        }

        if (result.type === "cancel") {
            return { success: false, error: "사용자가 로그인을 취소했습니다." };
        }

        return { success: false, error: "네이버 로그인에 실패했습니다." };
    } catch (error) {
        console.error("Naver sign in error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "네이버 로그인 중 오류가 발생했습니다.",
        };
    }
}

/**
 * Get Naver user info from access token
 */
async function getNaverUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch("https://openapi.naver.com/v1/nid/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    const profile = data.response;

    return {
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.nickname,
        picture: profile.profile_image,
        provider: "naver",
    };
}

/**
 * Sign in with Apple (iOS only)
 */
export async function signInWithApple(): Promise<AuthResult> {
    try {
        if (Platform.OS !== "ios") {
            return { success: false, error: "Apple 로그인은 iOS에서만 사용할 수 있습니다." };
        }

        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
            return { success: false, error: "이 기기에서는 Apple 로그인을 사용할 수 없습니다." };
        }

        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });

        // Apple only provides name/email on FIRST sign-in.
        // On subsequent sign-ins these fields are null, so we fall back to stored data.
        const storedUser = await loadStoredUser();

        const userInfo: UserInfo = {
            id: credential.user,
            email: credential.email || storedUser?.email || "",
            name:
                credential.fullName?.givenName && credential.fullName?.familyName
                    ? `${credential.fullName.familyName}${credential.fullName.givenName}`
                    : storedUser?.name || "Apple 사용자",
            provider: "apple",
        };

        await AsyncStorage.setItem(AUTH_TOKEN_KEY, credential.identityToken || credential.user);
        await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

        return { success: true, user: userInfo };
    } catch (error: any) {
        if (error.code === "ERR_REQUEST_CANCELED") {
            return { success: false, error: "사용자가 로그인을 취소했습니다." };
        }
        console.error("Apple sign in error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Apple 로그인 중 오류가 발생했습니다.",
        };
    }
}

/**
 * Sign out - clear stored auth data
 */
export async function signOut(): Promise<void> {
    try {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_INFO_KEY);
    } catch (error) {
        console.error("Sign out error:", error);
    }
}

/**
 * Load stored user info
 */
export async function loadStoredUser(): Promise<UserInfo | null> {
    try {
        const userInfoStr = await AsyncStorage.getItem(USER_INFO_KEY);
        if (userInfoStr) {
            return JSON.parse(userInfoStr) as UserInfo;
        }
        return null;
    } catch (error) {
        console.error("Load stored user error:", error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        return token !== null;
    } catch (error) {
        return false;
    }
}
