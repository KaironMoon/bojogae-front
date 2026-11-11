import apiCaller from '@/services/api-caller';
// Anonymous navigation preference is managed by the server, without localStorage.
export async function shouldSkipLanding() {
  return (await apiCaller.get('/api/v1/auth/landing-preference')).data.skip_landing;
}
export async function skipLandingFromNowOn() {
  await apiCaller.post('/api/v1/auth/landing-preference?skip=true', {});
}
export async function showLandingFromNowOn() {
  await apiCaller.post('/api/v1/auth/landing-preference?skip=false', {});
}
