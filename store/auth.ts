import { create } from "zustand";
import {
  login,
  logout,
  register,
  resendEmail,
  resetPassword,
  sendForgotPasswordEmail,
  verifyCode,
  verifyEmail,
  fetchUser,
  completeOnboarding as completeOnboardingApi,
} from "@/lib/auth";
import { NewUser, updateUser, User, OnboardingInput } from "@/lib/data";
// interface User {
//   id: string;
//   email: string;
//   name?: string;
// }

interface AuthState {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (user: NewUser) => Promise<boolean>;
  verifyEmail: (data: { code: string; email: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  resendEmail: (email: string) => Promise<boolean>;
  sendForgotPasswordEmail: (email: string) => Promise<boolean>;
  resetPassword: (
    code: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  currentUser: () => Promise<User>;
  completeOnboarding: (input: OnboardingInput) => Promise<any>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  currentUser: async () => {
    try {
      set({ loading: true });
      const { data } = await fetchUser();
      set({ user: data });
      updateUser(data);
      set({ loading: false });
      return data;
    } catch (e) {
      set({ user: null });
      set({ loading: false });
      throw e;
    }
  },

  login: async (email, password) => {
    const { data } = await login(email, password);
    // The backend sets the HttpOnly mb_token cookie directly — no client-side cookie needed
    set({ user: data.user, token: data.token });
    updateUser(data.user);
    return data.user;
  },

  register: async (data: NewUser) => {
    const res = await register(data);
    return res?.success;
  },

  verifyEmail: async (data: { code: string; email: string }) => {
    const res = await verifyEmail(data);
    return res?.success;
  },

  resendEmail: async (email: string) => {
    const res = await resendEmail(email);
    return res?.success;
  },

  sendForgotPasswordEmail: async (email: string) => {
    const res = await sendForgotPasswordEmail(email);
    return res?.success;
  },

  resetPassword: async (code: string, email: string, password: string) => {
    const res = await resetPassword(code, email, password);
    return res?.success;
  },

  verifyCode: async (email: string, code: string) => {
    const res = await verifyCode(email, code);
    return res?.success;
  },

  completeOnboarding: async (input: OnboardingInput) => {
    const res = await completeOnboardingApi(input);
    if (res?.success && res?.data?.user) {
      set({ user: res.data.user });
      updateUser(res.data.user);
    }
    return res;
  },

  logout: async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      set({ user: null, token: null });
      updateUser(null);
    }
  },
}));
