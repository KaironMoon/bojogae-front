export function signupDestination(user) {
  if (user.status !== "ACTIVE") return "/access-restricted";
  if (user.role === "USER" && ["BASIC", "STANDARD", "PRO"].includes(user.signup_plan_code)) {
    return `/profile?signupPlan=${encodeURIComponent(user.signup_plan_code)}#plan`;
  }
  return "/home";
}
