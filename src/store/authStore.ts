import { create } from "zustand";
import {
    signInWithGoogle,
    signInWithNaver,
    signInWithApple,
    signOut as authSignOut,
    loadStoredUser,
    UserInfo,
} from "../services/authService";

interface AuthStore {
    // State
    user: UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Actions
    signInWithGoogle: () => Promise<boolean>;
    signInWithNaver: () => Promise<boolean>;
    signInWithApple: () => Promise<boolean>;
    signOut: () => Promise<void>;
    loadStoredAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,

    signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await signInWithGoogle();

            if (result.success && result.user) {
                set({
                    user: result.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return true;
            } else {
                set({
                    error: result.error || "Google 로그인에 실패했습니다.",
                    isLoading: false,
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.",
                isLoading: false,
            });
            return false;
        }
    },

    signInWithNaver: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await signInWithNaver();

            if (result.success && result.user) {
                set({
                    user: result.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return true;
            } else {
                set({
                    error: result.error || "네이버 로그인에 실패했습니다.",
                    isLoading: false,
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.",
                isLoading: false,
            });
            return false;
        }
    },

    signInWithApple: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await signInWithApple();

            if (result.success && result.user) {
                set({
                    user: result.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return true;
            } else {
                set({
                    error: result.error || "Apple 로그인에 실패했습니다.",
                    isLoading: false,
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.",
                isLoading: false,
            });
            return false;
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        try {
            await authSignOut();
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "로그아웃 중 오류가 발생했습니다.",
                isLoading: false,
            });
        }
    },

    loadStoredAuth: async () => {
        set({ isLoading: true });
        try {
            const user = await loadStoredUser();
            if (user) {
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
