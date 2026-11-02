"""Past-due queue visibility and safe status wording; all APIs are mocked."""
import json
import os
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

BASE = os.environ.get('UI_BASE', 'http://127.0.0.1:33917')
USER = dict(id=1, role='ADMIN', status='ACTIVE', plan_code='FREE', email='admin@example.test', display_name='관리자', group_id=None)
ROWS = [
    dict(id='overdue-review', user_id=7, order_name='베이직 월 구독', product_code='BASIC', amount=19000,
         status='REVIEW', charge_job_status='REVIEW', charge_error_code='renewal_overdue'),
    dict(id='uncertain-charge', user_id=8, order_name='프로 월 구독', product_code='PRO', amount=49000,
         status='SCHEDULED', charge_job_status='DISPATCHING'),
    dict(id='future-ready', user_id=9, order_name='스탠다드 월 구독', product_code='STANDARD', amount=29000,
         status='SCHEDULED', charge_job_status='READY'),
]
for row in ROWS:
    row.update(period_start='2026-10-01T00:00:00Z', period_end='2026-11-01T00:00:00Z',
               created_at='2026-09-01T00:00:00Z', paid_at=None, refunded_amount=0)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    for width in (1280, 390):
        context = browser.new_context(viewport={'width': width, 'height': 950})
        errors, mutations = [], []
        def route(r):
            request, url = r.request, r.request.url
            if '/api/v1/' not in url:
                r.continue_() if url.startswith(BASE + '/') else r.abort()
                return
            path = urlsplit(url).path.split('/api/v1/', 1)[1]
            if request.method not in ('GET', 'OPTIONS'):
                mutations.append(path)
            body = {}
            if path == 'auth/me':
                body = USER
            elif path == 'payments/admin/reservations':
                body = dict(orders=ROWS, billing_health=dict(due=2, dispatching=1, review=1, failed=0, missing_renewals=3))
            elif path == 'points/me':
                body = dict(free_points=0, paid_points=0, total_points=0, expiring_points=0)
            r.fulfill(status=200, content_type='application/json', body=json.dumps(body), headers={
                'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'})
        context.route('**/*', route)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/admin/payment-reservations')
        page.get_by_role('heading', name='예약결제 목록').wait_for()
        page.get_by_text('예약 누락 확인 필요 3건', exact=False).wait_for()
        row = page.get_by_role('row').filter(has_text='overdue-review')
        assert '예정 시각을 지나 자동 청구를 보류했습니다.' in row.inner_text()
        pending = page.get_by_role('row').filter(has_text='uncertain-charge')
        assert '승인 결과 확인 중' in pending.inner_text()
        assert '결제 완료' not in pending.inner_text()
        assert page.get_by_role('row').filter(has_text='future-ready').is_visible()
        assert not errors, errors
        assert not mutations, mutations
        context.close()
    browser.close()
print('Scheduler admin queue desktop/mobile smoke passed; API mocked and external requests blocked.')
