import apiCaller from "@/services/api-caller";

async function getMyProfile() {
  const response = await apiCaller.get("/api/v1/users/me/profile");
  return response.data;
}

async function updateMyProfile(profile) {
  const response = await apiCaller.axiosInstance.patch(
    `${apiCaller.baseUrl}/api/v1/users/me/profile`,
    profile,
  );
  return response.data;
}

async function requestEmailChange(email) {
  const response = await apiCaller.post("/api/v1/users/me/email-change", { email });
  return response.data;
}

async function verifyEmailChangeCode(requestToken, code) {
  const response = await apiCaller.post("/api/v1/users/me/email-change/verify-code", {
    request_token: requestToken,
    code,
  });
  return response.data;
}

async function verifyEmailChangeLink(token) {
  const response = await apiCaller.post("/api/v1/users/me/email-change/verify-link", { token });
  return response.data;
}

async function getMyPlan() {
  const response = await apiCaller.get("/api/v1/users/me/plan");
  return response.data;
}

async function requestPlanChange(planCode) {
  const response = await apiCaller.post("/api/v1/users/me/plan-requests", { plan_code: planCode });
  return response.data;
}

async function cancelPlanRequest(requestId) {
  await apiCaller.delete(`/api/v1/users/me/plan-requests/${requestId}`);
}

export {
  cancelPlanRequest,
  getMyPlan,
  getMyProfile,
  requestPlanChange,
  requestEmailChange,
  updateMyProfile,
  verifyEmailChangeCode,
  verifyEmailChangeLink,
};
