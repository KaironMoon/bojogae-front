"""Admin refund-list regression checks; every API call uses synthetic responses."""
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3307'
USER = {'id': 2, 'role': 'ADMIN', 'status': 'ACTIVE', 'email': 'admin@example.com', 'display_name': '관리자', 'group_id': None}
ORDERS = [
    {'id': 'paid-order', 'order_name': '스탠다드 월 구독', 'amount': 29000, 'refunded_amount': 0, 'status': 'PAID', 'paid_at': '2026-10-23T07:00:00Z'},
    {'id': 'scheduled-order', 'order_name': '다음 회차 구독', 'amount': 29000, 'refunded_amount': 0, 'status': 'SCHEDULED'},
    {'id': 'refunded-order', 'order_name': '환불 완료 결제', 'amount': 19000, 'refunded_amount': 19000, 'status': 'PAID'},
    {'id': 'pending-refund', 'order_name': '환불 확인 중 결제', 'amount': 19000, 'refunded_amount': 0, 'status': 'PAID', 'refund_status': 'PENDING'},
]
posts, loads, errors = [], [], []
fail_first_refund = True
JOBS = [{'id': 'review-job', 'user_id': 7, 'customer_name': '문승욱', 'customer_email': 'owner@example.com', 'scope': 'SUBSCRIPTION', 'status': 'REVIEW', 'amount': 0, 'created_at': '2026-10-23T07:00:00Z', 'terminated_at': '2026-10-23T07:00:00Z'}, {'id': 'withdrawal-job', 'user_id': 8, 'customer_name': '탈퇴고객', 'customer_email': None, 'scope': 'WITHDRAWAL', 'status': 'COMPLETED', 'amount': 19000, 'created_at': '2026-10-22T07:00:00Z', 'terminated_at': '2026-10-22T07:00:00Z'}]

def handle(route):
    global fail_first_refund
    req = route.request
    path = req.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    status, body = 200, {}
    if req.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    if req.method == 'POST': posts.append((path, req.post_data_json))
    if path == 'auth/me': body = USER
    elif path == 'admin/users': body = {'items': [], 'page': 1, 'total_pages': 0, 'total': 0}
    elif path == 'web-push/configuration': body = {'enabled': False}
    elif path == 'payments/admin/termination-jobs':
        params = parse_qs(urlparse(req.url).query)
        q = params.get('q', [''])[0].lower(); state = params.get('status', [''])[0]
        items = [job for job in JOBS if (not state or job['status'] == state) and (not q or q in (job['customer_name'] + ' ' + (job['customer_email'] or '')).lower())]
        body = {'items': items, 'total': len(items), 'total_pages': 1 if items else 0, 'page': 1, 'page_size': 20}
    elif path.startswith('payments/admin/users/') and req.method == 'GET':
        loads.append(path)
        body = {'enabled': True, 'orders': ORDERS if path.endswith('/7') else [], 'card_verifications': [{'id': 'card-check', 'order_name': '카드 등록', 'amount': 1000, 'refunded_amount': 1000, 'status': 'COMPLETED'}],
                'termination_jobs': [{'id': 'review-job', 'scope': 'SUBSCRIPTION', 'status': 'REVIEW', 'amount': 0, 'terminated_at': '2026-10-23T07:00:00Z'}]}
    elif path == 'payments/admin/users/7/orders/paid-order/refund':
        if fail_first_refund:
            fail_first_refund = False
            status, body = 503, {'detail': 'portone_unavailable'}
        else:
            ORDERS[0]['refund_status'] = 'PENDING'
            body = {'refund_id': 'refund-request', 'status': 'PENDING_VERIFICATION'}
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body), headers=headers)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(BASE + '/admin/payment-support')
    page.get_by_role('heading', name='결제·환불 처리', exact=True).wait_for()
    menu = page.get_by_role('navigation', name='주요 메뉴', exact=True)
    assert menu.get_by_role('button', name='꼬막 관리', exact=True).get_attribute('aria-expanded') == 'true'
    menu.get_by_role('button', name='꼬막 지급·내역', exact=True).click()
    page.get_by_role('heading', name='꼬막 지급·내역', exact=True).wait_for()
    assert page.locator('#payment-support').count() == 0
    menu.get_by_role('button', name='결제·환불 처리', exact=True).click()
    queue = page.get_by_role('table', name='전체 구독 종료·탈퇴 검토 목록', exact=True)
    queue.get_by_text('문승욱 · #7', exact=True).wait_for()
    assert queue.get_by_text('탈퇴고객 · #8', exact=True).is_visible()
    assert not loads and not posts
    out = Path('/tmp/bojogae-payment-support-ui'); out.mkdir(exist_ok=True)
    page.screenshot(path=str(out / 'global-list.png'), full_page=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.get_by_role('button', name='검토하기', exact=True).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out / 'global-mobile.png'), full_page=True)
    page.set_viewport_size({'width': 1280, 'height': 1000})
    search = page.get_by_label('이름·이메일·고객번호 검색', exact=True)
    search.fill('owner@example.com')
    page.get_by_role('button', name='검색', exact=True).click()
    queue.get_by_text('문승욱 · #7', exact=True).wait_for()
    assert queue.get_by_text('탈퇴고객 · #8', exact=True).count() == 0
    queue.get_by_role('button', name='검토하기', exact=True).click()
    review = page.get_by_role('dialog', name='문승욱 · 구독 종료 검토', exact=True)
    review.get_by_role('table', name='고객지원 결제 목록', exact=True).wait_for()
    assert loads == ['payments/admin/users/7'] and not posts
    page.screenshot(path=str(out / 'customer-review.png'), full_page=True)
    assert review.get_by_label('사용자 ID (탈퇴 회원 포함)', exact=True).count() == 0
    review.get_by_role('button', name='목록으로', exact=True).click()
    review.wait_for(state='hidden')
    search.fill('not-a-customer')
    page.get_by_role('button', name='검색', exact=True).click()
    page.get_by_text('조건에 맞는 검토 건이 없습니다.', exact=True).wait_for()
    search.fill('')
    page.get_by_role('button', name='검색', exact=True).click()
    queue.get_by_text('문승욱 · #7', exact=True).wait_for()
    page.get_by_role('button', name='다른 고객의 결제 내역 직접 조회', exact=True).click()
    panel = page.locator('#payment-support')
    panel.get_by_label('사용자 ID (탈퇴 회원 포함)', exact=True).fill('7')
    panel.get_by_role('button', name='결제 내역 조회', exact=True).click()
    table = panel.get_by_role('table', name='고객지원 결제 목록', exact=True)
    paid = table.get_by_role('row').filter(has_text='paid-order')
    paid.get_by_role('button', name='환불 처리', exact=True).wait_for()
    for identifier in ['scheduled-order', 'refunded-order', 'pending-refund', 'card-check']:
        assert table.get_by_role('row').filter(has_text=identifier).get_by_role('button', name='환불 처리', exact=True).is_disabled()
    paid.get_by_role('button', name='환불 처리', exact=True).click()
    dialog = page.get_by_role('dialog', name='검토 후 환불 처리', exact=True)
    assert dialog.get_by_label('검토한 결제 ID', exact=True).input_value() == 'paid-order'
    assert dialog.get_by_label('검토한 결제 ID', exact=True).get_attribute('readonly') is not None
    assert not posts, posts
    assert dialog.get_by_role('button', name='검토 금액으로 환불', exact=True).is_disabled()
    dialog.get_by_role('button', name='닫기', exact=True).click()
    dialog.wait_for(state='hidden')
    assert not posts
    paid.get_by_role('button', name='환불 처리', exact=True).click()
    dialog.get_by_label('검토 후 확정한 환불액 (원)', exact=True).fill('1200')
    dialog.get_by_label('환불 처리 사유', exact=True).fill('모의 검토 결과')
    dialog.get_by_role('button', name='검토 금액으로 환불', exact=True).click()
    dialog.get_by_text('결제 상태를 확인 중입니다. 다시 결제하지 말고 결제 내역 확인을 눌러 주세요.', exact=True).wait_for()
    dialog.get_by_role('button', name='검토 금액으로 환불', exact=True).click()
    dialog.wait_for(state='hidden')
    assert len(posts) == 2
    assert posts[0][0] == posts[1][0] == 'payments/admin/users/7/orders/paid-order/refund'
    assert posts[0][1] == posts[1][1]
    assert posts[0][1]['expected_amount'] == 1200
    assert len(posts[0][1]['idempotency_key']) >= 16
    panel.get_by_role('alert').filter(has_text='요청 처리 결과: 환불 결과 확인 중').wait_for()
    assert len(loads) >= 2
    assert paid.get_by_role('button', name='환불 처리', exact=True).is_disabled()
    panel.get_by_role('button', name='검토 완료 처리', exact=True).click()
    assert panel.get_by_role('alert').filter(has_text='선택한 구독 종료 검토').is_visible()
    assert len(posts) == 2  # Selecting a review job is not completion.
    out = Path('/tmp/bojogae-payment-support-ui'); out.mkdir(exist_ok=True)
    page.screenshot(path=str(out / 'desktop.png'), full_page=True)
    panel.get_by_label('사용자 ID (탈퇴 회원 포함)', exact=True).fill('8')
    assert panel.get_by_role('table', name='고객지원 결제 목록', exact=True).count() == 0
    assert panel.get_by_role('alert').filter(has_text='선택한 구독 종료 검토').count() == 0
    panel.get_by_role('button', name='결제 내역 조회', exact=True).click()
    panel.get_by_text('사용자 #8 결제 목록', exact=True).wait_for()
    assert table.get_by_role('row').filter(has_text='paid-order').count() == 0
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out / 'mobile.png'), full_page=True)
    assert not errors, errors
    USER['role'] = 'USER'
    user_page = context.new_page()
    user_page.goto(BASE + '/admin/payment-support')
    user_page.wait_for_url(BASE + '/home')
    assert user_page.locator('#payment-support').count() == 0
    browser.close()
print('전체 고객 자동 목록·검색·ID 입력 없는 검토 진입·꼬막 관리 하위 메뉴 분리·결제 선택·비대상 차단·취소 시 미요청·환불 재시도 키 유지·목록 갱신·사용자 전환 초기화·모바일·관리자 접근 제한 확인 통과 (모의 API)')
