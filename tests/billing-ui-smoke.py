"""Subscription UI regression checks with synthetic API responses only.
Run with bojogae-backend/.venv/bin/python after Vite starts on 3307.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3307'
PRODUCTS = {code: {'name': name + ' 월 구독', 'amount': amount, 'cockles': points}
            for code, name, amount, points in [('BASIC', '베이직', 19000, 300), ('STANDARD', '스탠다드', 29000, 500), ('PRO', '프로', 49000, 1000)]}
# The unchanged backend may still advertise TOPUP. It must not create a UI entry.
PRODUCTS['TOPUP'] = {'name': '꼬막 추가 충전 150개', 'amount': 9900, 'cockles': 150}
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD', 'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
SUB = {'id': 'synthetic-sub', 'plan_code': 'STANDARD', 'current_plan_code': 'STANDARD', 'is_active': True, 'status': 'ACTIVE', 'period_end': '2099-11-02T03:00:00Z', 'cancel_at_period_end': False, 'next_plan_code': None}
BALANCE = {'free_points': 500, 'paid_points': 0, 'total_points': 500, 'expiring_points': 100, 'next_expiration': '2099-11-02T03:00:00Z'}
posts, errors = [], []
config_overrides = {}

def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    body = {}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    if request.method == 'POST':
        posts.append((path, request.post_data_json))
    if path == 'auth/me': body = USER
    elif path == 'users/me/profile': body = {**USER, 'name': '테스트', 'nickname': '테스트', 'phone': '01012345678', 'affiliation': '테스트'}
    elif path == 'points/me': body = BALANCE
    elif path == 'points/me/ledger': body = {'items': [], 'balance': 500, 'total_pages': 1, 'page': 1, 'total': 0}
    elif path == 'web-push/configuration': body = {'enabled': False, 'vapid_public_key': ''}
    elif path == 'payments/config': body = {'enabled': True, 'eligible': True, 'products': PRODUCTS, 'policyVersion': '2026-10-03', 'billingTestMode': True, **config_overrides}
    elif path == 'payments/me': body = {'enabled': True, 'subscription': SUB, 'orders': []}
    elif path == 'payments/subscriptions/upgrade-quote': body = {'paymentId': 'synthetic-upgrade', 'amount': 5000, 'cockles': 100, 'expiresAt': SUB['period_end'], 'nextAmount': 49000}
    elif path == 'payments/subscriptions/termination-preview': body = {'amount': 29000, 'requires_review': False}
    elif path == 'payments/subscriptions/upgrade': body = {'status': 'PAID'}
    elif path == 'users/me/personal-plan': body = {'plan_code': 'STANDARD', 'current_period_start': '2099-10-02', 'current_period_end': '2099-11-02'}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(body), headers=headers)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get("PLAYWRIGHT_CHANNEL"))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/profile')
    panel = page.locator('#plan')
    panel.get_by_text('월간 구독권', exact=True).wait_for()
    panel.get_by_role('button', name='요금제 변경', exact=True).wait_for()
    assert '꼬막' not in panel.inner_text()
    assert '충전' not in panel.inner_text()
    assert page.get_by_text('사용 가능 꼬막', exact=True).count() == 0
    assert page.get_by_text('7일 이내 만료 예정:', exact=False).count() == 0
    panel.get_by_role('button', name='요금제 변경', exact=True).click()
    dialog = page.get_by_role('dialog')
    assert '꼬막' not in dialog.inner_text()
    assert dialog.get_by_role('button', name='다음 결제부터 변경', exact=True).is_disabled()
    dialog.get_by_role('checkbox').check()
    dialog.get_by_role('button', name='다음 결제부터 변경', exact=True).click()
    dialog.wait_for(state='hidden')
    assert any(path == 'payments/subscriptions/change' and body['accepted'] for path, body in posts)
    panel.get_by_role('button', name='요금제 변경', exact=True).click()
    dialog.get_by_role('combobox').click()
    page.get_by_role('option').filter(has_text='프로 월 구독').click()
    dialog.get_by_text('지금 결제할 차액: 5,000원', exact=True).wait_for()
    assert '꼬막' not in dialog.inner_text()
    dialog.get_by_role('checkbox').check()
    dialog.get_by_role('button', name='5,000원 결제·즉시 변경', exact=True).click()
    dialog.wait_for(state='hidden')
    assert any(path == 'payments/subscriptions/upgrade' and body['payment_id'] == 'synthetic-upgrade' for path, body in posts)
    panel.get_by_role('button', name='구독 해지', exact=True).click()
    dialog.get_by_label('즉시 구독 종료·환불 확인', exact=True).check()
    dialog.get_by_text('예상 구독료 환불액: 29,000원', exact=True).wait_for()
    assert '꼬막' not in dialog.inner_text()
    dialog.get_by_role('button', name='닫기', exact=True).click()
    out = Path('/tmp/bojogae-billing-ui')
    out.mkdir(exist_ok=True)
    page.screenshot(path=str(out / 'desktop.png'), full_page=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out / 'mobile.png'), full_page=True)
    page.goto(BASE + '/my-coins')
    page.get_by_text('사용 가능 꼬막', exact=True).wait_for()
    assert page.get_by_text('500꼬막', exact=True).is_visible()
    assert page.get_by_text('7일 이내 만료 예정:', exact=False).is_visible()
    assert page.get_by_role('link', name='꼬막 충전', exact=True).count() == 0
    page.get_by_role('button', name='잔여 꼬막 상세', exact=True).click()
    dialog.get_by_text('총 잔여 꼬막: 500꼬막', exact=True).wait_for()
    dialog.get_by_role('button', name='닫기', exact=True).click()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out / 'mobile-coins.png'), full_page=True)
    for role, group_id, reason in [('ADMIN', None, 'ADMIN_ACCOUNT'), ('USER', 3, 'GROUP_ACCOUNT')]:
        USER.update(role=role, group_id=group_id)
        config_overrides.update(eligible=False, ineligibleReason=reason)
        page.goto(BASE + '/profile')
        page.locator('#plan').get_by_text('월간 구독권', exact=True).wait_for()
        assert '꼬막' not in page.locator('#plan').inner_text()
    USER.update(role='USER', group_id=None)
    config_overrides.update(enabled=False, requestedEnabled=True)
    page.reload()
    page.get_by_text('결제 연동 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.', exact=True).wait_for()
    assert not any(path == 'payments/orders' for path, _ in posts)
    assert not errors, errors
    browser.close()
print('구독 변경·업그레이드·해지 안내, 추가 충전 제거, 내꼬막 잔액·만료·상세, 모바일 확인 통과 (모의 API)')
