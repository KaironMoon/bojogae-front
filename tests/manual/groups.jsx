// 모든 API를 메모리 어댑터로 대체합니다. 실제 DB·메일·결제·코인은 사용하지 않습니다.
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { Box, Button, CssBaseline, Stack, ThemeProvider, Typography, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import api from '../../src/services/api-caller';
import GroupsPage from '../../src/pages/groups/GroupsPage';
import LoginPage from '../../src/pages/auth/LoginPage';
import GroupPasswordPage from '../../src/pages/auth/GroupPasswordPage';

const admin = { id: 1, email: 'admin@example.com', display_name: '관리자', role: 'ADMIN', status: 'ACTIVE' };
const leader = { id: 10, email: null, display_name: 'L001', role: 'USER', status: 'ACTIVE', group_id: 1, group_role: 'LEADER', employee_number: 'L001', must_change_password: false };
let current = admin;
let passwordChanged = false;
let group = { id: 1, name: 'XX보험 XX지점', monthly_basic_points: 100 };
let members = [{ ...leader, balance: { free_points: 100, paid_points: 50 } }, { id: 20, employee_number: 'M001', display_name: 'M001', email: null, group_role: 'MEMBER', status: 'ACTIVE', must_change_password: true, balance: { free_points: 100, paid_points: 0 } }];
let transfers = [];
let purchases = [];
api.axiosInstance.defaults.adapter = async (config) => {
  const path = new URL(config.url, 'http://localhost').pathname;
  const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
  let result = null;
  if (path.endsWith('/auth/me')) {
    if (!current) throw Object.assign(new Error('Unauthenticated'), { response: { status: 401 } });
    result = current;
  } else if (path.endsWith('/auth/options')) result = { local_email_login_enabled: false };
  else if (path.endsWith('/auth/logout')) current = null;
  else if (path.endsWith('/auth/group-login')) { current = { ...leader, must_change_password: !passwordChanged }; result = current; }
  else if (path.endsWith('/auth/group-password')) { passwordChanged = true; current = null; }
  else if (path.endsWith('/auth/group-password-reset')) result = null;
  else if (path.endsWith('/groups/search') || (path.endsWith('/admin/groups') && config.method === 'get')) result = [group];
  else if (path.endsWith('/admin/groups') && config.method === 'post') { group = { id: 1, name: data.name, monthly_basic_points: data.monthly_basic_points }; members[0].employee_number = data.employee_number; members[0].balance.free_points = data.monthly_basic_points; result = { group, leader: members[0] }; }
  else if (path.endsWith('/groups/1/monthly-points')) { group.monthly_basic_points = data.monthly_basic_points; result = group; }
  else if (path.endsWith('/groups/1/points/bulk')) {
    const results = data.member_ids.map((id) => {
      const member = members.find((item) => item.id === id);
      const amount = data.action === 'DISTRIBUTE' ? data.amount : Math.min(data.amount, member.balance.paid_points);
      const sender = data.action === 'DISTRIBUTE' ? members[0] : member;
      const recipient = data.action === 'DISTRIBUTE' ? member : members[0];
      sender.balance.paid_points -= amount; recipient.balance.paid_points += amount;
      if (amount) transfers.unshift({ id: transfers.length + 1, action: data.action, amount, sender_number: sender.employee_number, recipient_number: recipient.employee_number, created_at: new Date().toISOString() });
      return { member_id: id, amount };
    });
    result = { batch_id: 1, results, total_amount: results.reduce((sum, item) => sum + item.amount, 0) };
  }
  else if (path.endsWith('/groups/1/name')) { group.name = data.name; result = group; }
  else if (path.endsWith('/groups/1/members')) { const member = { ...data, id: 21 + members.length, display_name: data.display_name || data.employee_number, status: 'ACTIVE', group_role: 'MEMBER', must_change_password: true, balance: { free_points: 100, paid_points: 0 } }; members.push(member); result = member; }
  else if (path.endsWith('/groups/1/identity')) result = { id: group.id, name: group.name };
  else if (path.endsWith('/groups/1')) result = { group: { ...group }, members: structuredClone(members), transfers: [...transfers], purchases: [...purchases] };
  else if (path.endsWith('/groups/1/purchases/direct')) {
    const existing = purchases.find((p) => p.idempotency_key === data.idempotency_key);
    if (existing) result = existing;
    else {
      if (purchases.some((p) => p.payment_reference === data.payment_reference)) throw Object.assign(new Error('Duplicate'), { response: { status: 409, data: { detail: 'payment_reference_duplicate' } } });
      const purchase = { id: purchases.length + 1, amount: data.amount, status: 'APPROVED', payment_reference: data.payment_reference, is_direct: true, idempotency_key: data.idempotency_key, created_at: new Date().toISOString() };
      members[0].balance.paid_points += data.amount;
      purchases.unshift(purchase); result = purchase;
    }
  }
  else if (path.endsWith('/groups/1/purchases')) { const request = { id: purchases.length + 1, amount: data.amount, status: 'PENDING', created_at: new Date().toISOString() }; purchases.unshift(request); result = request; }
  else if (/\/members\/\d+\/points$/.test(path)) {
    const id = Number(path.split('/').at(-2)); const member = members.find((item) => item.id === id);
    const amount = data.amount;
    const sender = data.action === 'DISTRIBUTE' ? members[0] : member;
    const recipient = data.action === 'DISTRIBUTE' ? member : members[0];
    sender.balance.paid_points -= amount; recipient.balance.paid_points += amount;
    const transfer = { id: transfers.length + 1, action: data.action, amount, sender_number: sender.employee_number, recipient_number: recipient.employee_number, created_at: new Date().toISOString() }; transfers.unshift(transfer); result = transfer;
  } else if (/\/members\/\d+\/status$/.test(path)) {
    const member = members.find((item) => item.id === Number(path.split('/').at(-2)));
    member.status = data.active ? 'ACTIVE' : 'SUSPENDED';
    if (!data.active) { members[0].balance.paid_points += member.balance.paid_points; member.balance.paid_points = 0; }
    result = member;
  } else if (/\/members\/\d+$/.test(path)) { const member = members.find((item) => item.id === Number(path.split('/').at(-1))); Object.assign(member, data); result = member; }
  return { data: result, status: 200, statusText: 'OK', headers: {}, config };
};
export function Controls() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const change = async (user, path) => { current = user; await refreshUser(); navigate(path); };
  return <Stack direction="row" spacing={1} sx={{ mb: 3 }}><Button onClick={() => change(admin, '/tests/manual/groups.html')}>관리자 테스트</Button><Button onClick={() => change(leader, '/group')}>리더 테스트</Button><Button onClick={() => change(null, '/')}>로그인 테스트</Button><Button onClick={() => change({ ...leader, must_change_password: true }, '/group/change-password')}>최초 비밀번호 변경 테스트</Button></Stack>;
}
createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><HashRouter><AuthProvider><Box sx={{ p: 3 }}><Typography variant="h6">그룹 기능 격리 테스트 — 실제 API 호출 없음</Typography><Controls /><Routes>
  <Route path="/tests/manual/groups.html" element={<GroupsPage />} /><Route path="/group" element={<GroupsPage />} /><Route path="/group/:groupId" element={<GroupsPage />} /><Route path="/admin/groups" element={<GroupsPage />} /><Route path="/admin/groups/:groupId" element={<GroupsPage />} /><Route path="/" element={<LoginPage />} /><Route path="/group/change-password" element={<GroupPasswordPage />} /><Route path="/home" element={<GroupsPage />} />
</Routes></Box></AuthProvider></HashRouter></ThemeProvider>);
