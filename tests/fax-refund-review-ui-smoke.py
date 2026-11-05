"""Fax review operations use synthetic responses only; no DB, payment or dial."""
import json
import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

BASE = os.environ.get('BOJOGAE_UI_BASE', 'http://127.0.0.1:3307')
USER = dict(id=2, role='ADMIN', status='ACTIVE', email='admin@example.com',
            display_name='관리자', group_id=None)
ITEMS = [dict(id=i, user_id=108, fax_attempt_id=i, point_cost=points,
              status='REVIEW_REQUIRED', created_at='2026-11-05T07:03:06Z',
              customer_name='팩스고객', customer_email='fax@example.com',
              request_id=95, pages=19, pages_sent=0, fax_status='UNKNOWN',
              started_at=None, completed_at='2026-11-05T07:08:22Z',
              error_code='START_UNCONFIRMED', refunded_points=0,
              decided_at=None, decided_by=None, decision_reason=None)
         for i, points in [(26, 12), (19, 19)]]
posts, errors = [], []


def handle(route):
    req = route.request
    path = req.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
               'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    body = {}
    if req.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'payments/admin/fax-refund-reviews':
        params = parse_qs(urlparse(req.url).query)
        state = params.get('status', ['REVIEW_REQUIRED'])[0]
        query = params.get('q', [''])[0]
        rows = [item for item in ITEMS if item['status'] == state and
                (not query or query in item['customer_email'] or query == str(item['user_id']))]
        body = {'items': rows, 'total': len(rows), 'total_pages': int(bool(rows)), 'page': 1}
    elif path.endswith('/decide'):
        posts.append(req.post_data_json)
        item = next(item for item in ITEMS if str(item['id']) == path.split('/')[-2])
        item.update(status='REFUNDED' if req.post_data_json['action'] == 'REFUND' else 'CONSUMED',
                    decision_reason=req.post_data_json['reason'], decided_by=2,
                    decided_at='2026-11-06T00:00:00Z')
        if item['status'] == 'REFUNDED':
            item['refunded_points'] = item['point_cost']
        body = item
    elif path == 'payments/admin/termination-jobs':
        body = {'items': [], 'total': 0, 'total_pages': 0, 'page': 1}
    elif path == 'admin/users':
        body = {'items': [], 'total': 0, 'total_pages': 0, 'page': 1}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.set_default_timeout(10000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/admin/payment-support')
    table = page.get_by_role('table', name='팩스 꼬막 반환 검토 목록', exact=True)
    table.get_by_role('row').filter(has_text='시도 #26').wait_for()
    assert not posts
    search = page.get_by_label('팩스 고객 이름·이메일·고객번호 검색', exact=True)
    search.fill('missing@example.com')
    search.press('Enter')
    table.get_by_text('조건에 맞는 팩스 반환 검토 건이 없습니다.', exact=True).wait_for()
    search.fill('108')
    search.press('Enter')
    row = table.get_by_role('row').filter(has_text='시도 #26')
    row.get_by_role('button', name='검토하기').click()
    dialog = page.get_by_role('dialog', name='팩스 꼬막 반환 · 시도 #26', exact=True)
    confirm = dialog.get_by_role('button', name='12꼬막 반환 확정', exact=True)
    assert confirm.is_disabled() and not posts
    dialog.get_by_label('검토·처리 사유').fill('발신 전 중단 확인')
    out = Path('/tmp/bojogae-fax-refund-ui')
    out.mkdir(exist_ok=True)
    page.screenshot(path=str(out / 'review-dialog.png'), full_page=True, animations='disabled')
    confirm.click()
    page.get_by_text('12꼬막 반환을 완료했습니다.', exact=True).wait_for()
    assert posts == [{'action': 'REFUND', 'reason': '발신 전 중단 확인', 'expected_points': 12}]
    assert table.get_by_role('row').filter(has_text='시도 #26').count() == 0

    # Completed records retain the reason/admin and cannot be refunded again.
    page.get_by_label('팩스 처리 상태', exact=True).click()
    page.get_by_role('option', name='반환 완료', exact=True).click()
    table.get_by_role('button', name='처리 내역').click()
    page.get_by_text('사유: 발신 전 중단 확인', exact=False).wait_for()
    assert page.get_by_role('button', name='12꼬막 반환 확정', exact=True).count() == 0
    page.get_by_role('button', name='닫기', exact=True).click()
    page.get_by_label('팩스 처리 상태', exact=True).click()
    page.get_by_role('option', name='검토 필요', exact=True).click()

    # Review and keep also work on a phone-sized viewport.
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='검토하기', exact=True).click()
    dialog = page.get_by_role('dialog', name='팩스 꼬막 반환 · 시도 #19', exact=True)
    dialog.get_by_label('처리 방법', exact=True).click()
    page.get_by_role('option', name='차감 유지', exact=True).click()
    dialog.get_by_label('검토·처리 사유').fill('수신처 확인 후 차감 유지')
    dialog.get_by_role('button', name='차감 유지 확정', exact=True).click()
    page.get_by_text('차감 유지로 검토를 완료했습니다.', exact=True).wait_for()
    dialog.wait_for(state='hidden')
    assert len(posts) == 2 and posts[-1]['action'] == 'KEEP'
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out / 'mobile.png'), full_page=True, animations='disabled')
    page.set_viewport_size({'width': 1280, 'height': 1000})
    page.get_by_label('팩스 처리 상태', exact=True).click()
    page.get_by_role('option', name='차감 유지', exact=True).click()
    table.get_by_role('row').filter(has_text='시도 #19').wait_for()
    page.get_by_role('listbox').wait_for(state='hidden')
    page.screenshot(path=str(out / 'desktop.png'), full_page=True, animations='disabled')
    assert not errors, errors
    USER['role'] = 'USER'
    user_page = context.new_page()
    user_page.goto(BASE + '/admin/payment-support')
    user_page.wait_for_url(BASE + '/home')
    assert user_page.get_by_role('heading', name='팩스 꼬막 반환 검토', exact=True).count() == 0
    browser.close()
print('팩스 검토 목록·검색·사유 필수·전액 반환·차감 유지·처리 이력·모바일·관리자 접근 제한 통과 (모의 API)')
