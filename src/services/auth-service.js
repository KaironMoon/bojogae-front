import apiCaller from "@/services/api-caller";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function getCurrentUser() {
  const response = await apiCaller.get("/api/v1/auth/me");
  return response.data;
}

async function logout() {
  await apiCaller.post("/api/v1/auth/logout");
}

export async function getPointGrants(userId, page = 1, grantFilter = 'ACTIVE') {
  return (await apiCaller.get(`/api/v1/admin/users/${userId}/points/grants`, { page, grant_filter: grantFilter })).data;
}

async function getUsers(status, page = 1, pageSize = 20) {
  const response = await apiCaller.get("/api/v1/admin/users", {
    status: status || undefined,
    page,
    page_size: pageSize,
  });
  return response.data;
}

async function updateUserStatus(userId, status, reason = null) {
  const response = await apiCaller.axiosInstance.patch(
    `${API_BASE_URL}/api/v1/admin/users/${userId}/status`,
    { status, reason },
  );
  return response.data;
}

async function updateUserRole(userId, role) {
  const response = await apiCaller.axiosInstance.patch(
    `${API_BASE_URL}/api/v1/admin/users/${userId}/role`,
    { role },
  );
  return response.data;
}

async function deleteUser(userId) {
  await apiCaller.delete(`/api/v1/admin/users/${userId}`);
}

async function grantFreePoints(userId, { amount, expirationDate, reason, idempotencyKey }) {
  const response = await apiCaller.post(
    `/api/v1/admin/users/${userId}/points/free-grants`,
    {
      amount: Number(amount),
      expiration_date: expirationDate,
      reason,
      idempotency_key: idempotencyKey,
    },
  );
  return response.data;
}

async function sendSignupEmail(signupToken, email) {
  await apiCaller.post("/api/v1/auth/signup/email", {
    signup_token: signupToken,
    email,
  });
}

async function verifySignupCode(signupToken, code) {
  const response = await apiCaller.post("/api/v1/auth/signup/verify-code", {
    signup_token: signupToken,
    code,
  });
  return response.data;
}

async function verifySignupLink(token) {
  const response = await apiCaller.post("/api/v1/auth/signup/verify-link", {
    token,
  });
  return response.data;
}

function getOAuthLoginUrl(provider) {
  return `${API_BASE_URL}/api/v1/auth/${provider}/login`;
}

export {
  deleteUser,
  getCurrentUser,
  getOAuthLoginUrl,
  getUsers,
  grantFreePoints,
  logout,
  sendSignupEmail,
  updateUserStatus,
  updateUserRole,
  verifySignupCode,
  verifySignupLink,
};
