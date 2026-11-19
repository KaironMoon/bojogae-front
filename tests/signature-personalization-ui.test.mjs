import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.SIGNATURE_UI_BASE || 'http://127.0.0.1:3398';
const fullProfile = { affiliation: '테스트보험', branch_name: '서울지점', name: '홍설계', phone: '010-1234-5678' };
let profile = fullProfile, profileFailure = false;
const legacy = { id: 1, title: '기존 서명', body: '[소속] [지점]\n[이름] · [전화번호]', category: 'REPORT' };
const items = [legacy], saved = [], errors = [];
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await context.route('**/api/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname.split('/api/v1/')[1];
    const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let data = {};
    if (path === 'auth/me') data = { id: 7, role: 'USER', status: 'ACTIVE', plan_code: 'STANDARD', display_name: '홍설계', email: 'fixture@example.test', group_id: null };
    else if (path === 'users/me/profile') {
      await new Promise(resolve => setTimeout(resolve, 400));
      return route.fulfill({ status: profileFailure ? 500 : 200, json: profileFailure ? {} : profile, headers });
    } else if (path === 'points/me') data = { total_points: 50 };
    else if (path === 'web-push/configuration') data = { enabled: false };
    else if (path === 'message-templates/studio/signatures' && request.method() === 'POST') {
      data = { ...request.postDataJSON(), id: 2 }; saved.push(data); items.push(data);
    } else if (path === 'message-templates/studio/signatures') data = { items, total: items.length, next_after: null, counts: { ALL: items.length, REPORT: items.length, CARE: 0, CLAIM: 0, GREETING: 0 } };
    else if (path === 'message-templates/signatures') data = { items, next_after: null };
    else if (path === 'message-templates/snippets') data = { items: [], next_after: null };
    else if (path === 'message-templates/studio/preview') data = { text: request.postDataJSON().text };
    await route.fulfill({ status: 200, json: data, headers });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/kakao-message-templates/signatures');
  await page.getByRole('button', { name: '기존 서명 수정', exact: true }).click();
  const dialog = page.getByRole('dialog'), body = dialog.locator('textarea.sig-clean-text');
  await body.waitFor();
  assert.equal(await body.inputValue(), '테스트보험 서울지점\n홍설계 · 010-1234-5678');
  await dialog.getByRole('button', { name: '취소', exact: true }).click();

  await page.getByRole('button', { name: '서명 등록', exact: true }).click();
  await dialog.getByPlaceholder('예: 현대홈쇼핑 / 보험금 청구 안내용').fill('새 서명');
  await dialog.getByRole('button', { name: '+ 소속·지점', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('textarea.sig-clean-text')?.value.includes('테스트보험 서울지점'));
  await dialog.getByRole('button', { name: '+ 내 이름', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('textarea.sig-clean-text')?.value.includes('홍설계'));
  await dialog.getByRole('button', { name: '+ 내 전화번호', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('textarea.sig-clean-text')?.value.includes('010-1234-5678'));
  await dialog.getByRole('button', { name: '저장', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(saved.length, 1);
  assert.match(saved[0].body, /테스트보험 서울지점/);
  assert.doesNotMatch(saved[0].body, /\[(?:소속|지점|이름|전화번호)\]/);

  profile = { ...fullProfile, name: null };
  await page.getByRole('button', { name: '서명 등록', exact: true }).click();
  const unexpectedAlerts = [];
  const unexpectedAlert = async event => { unexpectedAlerts.push(event.message()); await event.accept(); };
  page.on('dialog', unexpectedAlert);
  await dialog.getByRole('button', { name: '+ 내 이름', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('textarea.sig-clean-text')?.value.includes('홍설계'));
  page.off('dialog', unexpectedAlert);
  assert.deepEqual(unexpectedAlerts, []);
  await dialog.getByRole('button', { name: '취소', exact: true }).click();

  async function rejectedInsertion(expected) {
    await page.getByRole('button', { name: '서명 등록', exact: true }).click();
    const alert = new Promise(resolve => page.once('dialog', async event => { const message = event.message(); await event.accept(); resolve(message); }));
    await dialog.getByRole('button', { name: '+ 소속·지점', exact: true }).click();
    assert.match(await alert, expected);
    assert.equal(await body.inputValue(), '');
    await dialog.getByRole('button', { name: '취소', exact: true }).click();
  }
  profile = { ...fullProfile, affiliation: '', branch_name: '' };
  await rejectedInsertion(/소속·지점 정보가 없습니다/);
  profileFailure = true;
  await rejectedInsertion(/내 정보를 불러오지 못해/);
  profileFailure = false; profile = fullProfile;
  await page.getByRole('button', { name: /표준 명함·연락처형/ }).click();
  await body.waitFor();
  assert.match(await body.inputValue(), /테스트보험 서울지점/);
  assert.match(await body.inputValue(), /홍설계/);
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  assert.deepEqual(errors, []);
  console.log('PASS: delayed profile insertion, resolved legacy signatures, saved actual values, missing-information alert, profile-error alert, personalized preset.');
} finally { await browser.close(); }
