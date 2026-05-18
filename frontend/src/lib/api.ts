import axios from "axios";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BACKEND,
});

export const chatApi = {
  send: (userId: string, message: string) =>
    api.post("/api/chat/", { user_id: userId, message }),
};

export const transactionApi = {
  getAll: (userId: string, days = 60) =>
    api.get(`/api/transactions/user/${userId}?days=${days}`),
  seed: (userId: string) =>
    api.post(`/api/transactions/seed/${userId}`),
  getMonthlySummary: (userId: string) =>
    api.get(`/api/transactions/monthly-summary/${userId}`),
  addBulk: (userId: string, transactions: any[], month: string) =>
    api.post("/api/transactions/bulk", { user_id: userId, transactions, month }),
};

export const authApi = {
  register: (data: { email: string; full_name: string; monthly_income: number }) =>
    api.post("/api/auth/register", data),
  getUser: (userId: string) =>
    api.get(`/api/auth/user/${userId}`),
};

export const analyticsApi = {
  getDashboard: (userId: string) =>
    api.get(`/api/analytics/dashboard/${userId}`),
  getForecast: (userId: string) =>
    api.get(`/api/analytics/forecast/${userId}`),
  getCarbon: (userId: string) =>
    api.get(`/api/analytics/carbon/${userId}`),
};

export const transactionCreateApi = {
  create: (data: {
    user_id: string; amount: number; category: string;
    description: string; transaction_date: string; is_income: boolean;
  }) => api.post("/api/transactions/", data),
};

export const goalsApi = {
  getAll: (userId: string) =>
    api.get(`/api/goals/user/${userId}`),
  create: (data: { user_id: string; title: string; target_amount: number; current_amount?: number; deadline?: string }) =>
    api.post("/api/goals/", data),
  deposit: (goalId: string, amount: number) =>
    api.patch(`/api/goals/${goalId}/deposit?amount=${amount}`),
  seed: (userId: string) =>
    api.post(`/api/goals/seed/${userId}`),
};

export const visionApi = {
  extract: (file: File, userId: string, save = true) => {
    const form = new FormData();
    form.append("file", file);
    form.append("user_id", userId);
    form.append("save", save ? "true" : "false");
    return api.post("/api/vision/extract", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  preview: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("user_id", "00000000-0000-0000-0000-000000000000");
    form.append("save", "false");
    return api.post("/api/vision/extract", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;
