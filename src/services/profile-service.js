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

export {
  getMyProfile,
  requestEmailChange,
  updateMyProfile,
  verifyEmailChangeCode,
  verifyEmailChangeLink,
};
