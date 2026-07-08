import { api } from "./api";
import { NewUser } from "./data";

export const login = async (email: string, password: string, remember = false) => {
  const response = await api.post("/auth/login", { email, password, remember });
  return response.data;
};

export const register = async (user: NewUser) => {
  const response = await api.post("/auth/register", user);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error: any) {
    console.error("Logout API error:", error.message);
  }
};

export const verifyEmail = async (data: { code: string; email: string }) => {
  const res = await api.post("/auth/email/verify", { ...data });
  return res.data;
};

export const resendEmail = async (email: string) => {
  const res = await api.post("/auth/email", { email });
  return res.data;
};

export const sendForgotPasswordEmail = async (email: string) => {
  const res = await api.post("/auth/password/forgot", { email });
  return res.data;
};

export const resetPassword = async (
  code: string,
  email: string,
  password: string
) => {
  const res = await api.post("/auth/password/reset", {
    email,
    code,
    newPassword: password,
  });
  return res.data;
};

export const fetchUser = async (): Promise<any> => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const verifyCode = async (email: string, code: string, type?: string) => {
  const res = await api.post("/auth/code/verify", {
    email,
    code,
    ...(type ? { type } : {}),
  });
  return res.data;
};

// ─── Onboarding API ──────────────────────────────────────────────────────────

export const completeOnboarding = async (data: {
  experienceLevel?: string;
  learningGoal?: string;
  weeklyCommitment?: string;
  skipped?: boolean;
}) => {
  const response = await api.post("/auth/onboarding", data);
  return response.data;
};

export const getOnboardingRecommendation = async () => {
  const response = await api.get("/auth/onboarding/recommendation");
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const res = await api.post("/auth/password/change", { oldPassword, newPassword });
  return res.data;
};
