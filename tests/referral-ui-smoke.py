"""All API responses are synthetic. Start Vite on 3307, then run with backend .venv Python."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3307'
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'FREE', 'email': 'me@example.com', 'display_name': '추천 테스트', 'group_id': None}
referral = {'eligible': True, 'email': USER['email'], 'alias': None, 'registered': False, 'referral': None}
requests, errors = [], []
schema_missing = False

def handle(route):
    req = route.request
    path = req.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    if req.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    payload = req.post_data_json if req.method in ('POST', 'PUT') else None
    if payload is not None: requests.append((path, payload))
    status, body = 200, {}
    if path == 'auth/me': body = USER
    elif path == 'users/me/profile': body = {**USER, 'name': '추천 테스트', 'phone': '01012345678', 'nickname': '', 'affiliation': '테스트GA'}
    elif path == 'users/me/referral/alias':
        if payload['alias'] == 'taken': status, body = 409, {'detail': 'referral_alias_taken'}
        else: referral['alias'] = payload['alias'].lower() if payload['alias'] else None; body = {'alias': referral['alias']}
    elif path == 'users/me/referral':
        if schema_missing: status, body = 503, {'detail': 'referral_schema_required'}
        elif req.method == 'POST':
            if payload['referrer'] == USER['email']: status, body = 400, {'detail': 'self_referral_not_allowed'}
            else:
                referral.update(registered=True, referral={'id': 42, 'referrer_user_id': 9, 'bonus_amount': 50, 'bonus_expires_at': '2099-11-22T07:00:00Z'})
                body = {'id': 42}
        else: body = referral
    elif path == 'points/me': body = {'free_points': 250, 'paid_points': 0, 'total_points': 250, 'expiring_points': 0}
    elif path == 'points/me/ledger': body = {'items': [{'id': 'grant:42', 'occurred_at': '2026-10-23T07:00:00Z', 'description': '추천인 등록 보너스 +50꼬막', 'credit': 50, 'debit': 0, 'balance_after': 250}], 'balance': 250, 'total_pages': 1}
    elif path == 'payments/config': body = {'enabled': True, 'eligible': True, 'products': {code: {'name': name, 'amount': price} for code, name, price in [('BASIC', '베이직', 19000), ('STANDARD', '스탠다드', 29000), ('PRO', '프로', 49000)]}, 'policyVersion': 'synthetic'}
    elif path == 'payments/me': body = {'subscription': None, 'orders': []}
    elif path == 'web-push/configuration': body = {'enabled': False}
    elif path == 'ga-companies': body = []
    elif path == 'auth/signup/email': status = 204
    route.fulfill(status=status, content_type='application/json', body='' if status == 204 else json.dumps(body), headers=headers)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(BASE + '/profile')
    panel = page.locator('#referral')
    try:
        panel.get_by_text('기본 추천 이메일: me@example.com', exact=True).wait_for(timeout=10000)
    except Exception:
        print('UI:', page.locator('body').inner_text())
        print('JS errors:', errors)
        raise
    alias = panel.get_by_label('내 추천용 닉네임 (선택)', exact=True)
    alias.fill('taken')
    panel.get_by_role('button', name='추천용 닉네임 저장', exact=True).click()
    panel.get_by_text('이미 사용 중인 추천용 닉네임입니다.', exact=True).wait_for()
    alias.fill('My-Alias')
    panel.get_by_role('button', name='추천용 닉네임 저장', exact=True).click()
    panel.get_by_text('추천용 닉네임을 저장했습니다.', exact=True).wait_for()
    assert alias.input_value() == 'my-alias'
    selector = panel.get_by_label('추천인 이메일 또는 추천용 닉네임', exact=True)
    selector.fill('me@example.com')
    panel.get_by_role('button', name='추천인 등록', exact=True).click()
    panel.get_by_text('본인을 추천인으로 등록할 수 없습니다.', exact=True).wait_for()
    selector.fill('friend-alias')
    panel.get_by_role('button', name='추천인 등록', exact=True).click()
    panel.get_by_text('추천인을 등록하고 보너스 50꼬막을 지급했습니다.', exact=True).wait_for()
    assert panel.get_by_role('button', name='추천인 등록', exact=True).count() == 0
    assert '보너스 50꼬막' in panel.inner_text()
    page.set_viewport_size({'width': 390, 'height': 844})
    panel.scroll_into_view_if_needed()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    out = Path('/tmp/bojogae-referral-ui'); out.mkdir(exist_ok=True)
    page.screenshot(path=str(out / 'profile-mobile.png'), full_page=True)
    page.goto(BASE + '/my-coins')
    page.get_by_text('추천인 등록 보너스 +50꼬막', exact=True).wait_for()
    assert page.get_by_text('250꼬막', exact=True).count() >= 1
    schema_missing = True
    page.goto(BASE + '/profile')
    page.locator('#referral').get_by_text('추천인 기능의 DB 설정이 아직 적용되지 않았습니다.', exact=True).wait_for()
    page.goto(BASE + '/signup/complete?token=' + 's'*48 + '&plan=FREE')
    page.get_by_role('combobox', name='GA 소속', exact=True).fill('테스트GA')
    page.get_by_role('textbox', name='이름', exact=True).fill('추천 가입자')
    page.get_by_role('textbox', name='전화번호', exact=True).fill('01012345678')
    page.get_by_role('textbox', name='이메일', exact=True).fill('new@example.com')
    page.get_by_label('추천인 이메일 또는 추천용 닉네임 (선택)', exact=True).fill('friend-alias')
    page.get_by_role('checkbox').check()
    page.get_by_role('button', name='인증메일 보내기', exact=True).click()
    page.get_by_label('6자리 인증번호', exact=True).wait_for()
    sent = next(body for path, body in requests if path == 'auth/signup/email')
    assert sent['referrer'] == 'friend-alias'
    assert not any(path == 'auth/signup/verify-code' for path, _ in requests)
    assert page.get_by_label('추천인 이메일 또는 추천용 닉네임 (선택)', exact=True).is_disabled()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out / 'signup-mobile.png'), full_page=True)
    assert not errors, errors
    browser.close()
print('추천용 닉네임 변경·중복 안내·추천인 등록·자기추천 차단·내꼬막 원장·가입 입력·SQL 미적용 안내·모바일 확인 통과 (모의 API)')
