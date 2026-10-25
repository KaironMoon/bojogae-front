"""Synthetic API-only checks; start Vite on 3317 and run with backend .venv Python."""
import json
import os
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3317')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
CUSTOMERS = {
    1: {'id': 1, 'name': '시험고객', 'phone': '01012345678', 'resident_number': '900101-1'},
    2: {'id': 2, 'name': '다른고객', 'phone': '', 'resident_number': ''},
}
errors, searches, writes = [], [], []
fail_detail = False


def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
               'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    if request.method != 'GET':
        writes.append(path)
    status, body = 200, {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'claims/insurers':
        body = {'items': [{'id': 'test', 'name': '시험보험', 'kind': 'DAMAGE'}]}
    elif path == 'crm/customers':
        params = parse_qs(urlparse(request.url).query, keep_blank_values=True)
        searches.append(params)
        q = params.get('q', [''])[0]
        page = int(params.get('page', ['1'])[0])
        items = list(CUSTOMERS.values()) if not q else [c for c in CUSTOMERS.values() if q in c['name'] or q in c['phone']]
        body = {'items': items if page == 1 else [CUSTOMERS[2]], 'total': 11 if not q else len(items), 'page': page, 'page_size': 10}
    elif path.endswith('/contract-party'):
        if fail_detail:
            status, body = 404, {'detail': 'crm_not_found'}
        else:
            c = CUSTOMERS[int(path.split('/')[-2])]
            body = {**c, 'customer_id': c['id'], 'details_confirmed': True}
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/claims/new')
    page.get_by_role('checkbox', name='시험보험', exact=True).check()
    page.get_by_role('button', name='다음', exact=True).click()

    def open_customer(party):
        page.get_by_role('button', name=f'{party} · 내 고객 불러오기', exact=True).click()
        dialog = page.get_by_role('dialog')
        dialog.get_by_role('button', name='시험고객 고객 불러오기').wait_for()
        return dialog

    dialog = open_customer('피보험자')
    dialog.get_by_label('고객 이름·연락처', exact=True).fill('010-1234-5678')
    dialog.get_by_role('button', name='검색', exact=True).click()
    expect(dialog.get_by_role('button', name='다른고객 고객 불러오기')).to_have_count(0)
    dialog.get_by_role('button', name='시험고객 고객 불러오기').click()
    expect(page.get_by_role('dialog')).to_have_count(0)
    expect(page.locator('[name=insured_name]')).to_have_value('시험고객')
    expect(page.locator('[name=insured_phone]')).to_have_value('010-1234-5678')
    expect(page.locator('[name=insured_id]')).to_have_value('900101-1')
    assert any(s.get('q') == ['01012345678'] and s.get('archived') == ['false'] for s in searches)
    page.locator('[name=insured_id]').fill('900101-1234567')
    page.get_by_role('checkbox', name='피보험자 법정대리인 정보 추가', exact=True).check()
    page.locator('[name=insured_guardian_name]').fill('이전보호자')
    canvas = page.get_by_role('img', name='피보험자 서명 입력 영역', exact=True)
    canvas.scroll_into_view_if_needed()
    box = canvas.bounding_box()
    page.mouse.move(box['x'] + 20, box['y'] + 20)
    page.mouse.down()
    page.mouse.move(box['x'] + 70, box['y'] + 50, steps=5)
    page.mouse.up()
    is_signed = """c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      return d.some((v, i) => i % 4 === 3 && v > 0); }"""
    assert canvas.evaluate(is_signed)
    dialog = open_customer('피보험자')
    dialog.get_by_role('button', name='Go to page 2', exact=True).click()
    expect(dialog.get_by_role('button', name='시험고객 고객 불러오기')).to_have_count(0)
    dialog.get_by_role('button', name='다른고객 고객 불러오기').click()
    expect(page.locator('[name=insured_name]')).to_have_value('다른고객')
    expect(page.locator('[name=insured_id]')).to_have_value('')
    expect(page.locator('[name=insured_phone]')).to_have_value('')
    expect(page.get_by_role('checkbox', name='피보험자 법정대리인 정보 추가', exact=True)).not_to_be_checked()
    assert not canvas.evaluate(is_signed)

    page.get_by_role('checkbox', name='보험금 수익자가 피보험자와 같습니다', exact=True).uncheck()
    dialog = open_customer('수익자')
    fail_detail = True
    dialog.get_by_role('button', name='시험고객 고객 불러오기').click()
    expect(dialog.get_by_role('alert')).to_contain_text('접근 권한이 없습니다')
    expect(page.locator('[name=insured_name]')).to_have_value('다른고객')
    expect(page.locator('[name=beneficiary_name]')).to_have_value('')
    fail_detail = False
    dialog.get_by_role('button', name='목록 다시 불러오기').click()
    dialog.get_by_role('button', name='시험고객 고객 불러오기').click()
    expect(page.locator('[name=beneficiary_name]')).to_have_value('시험고객')
    expect(page.locator('[name=beneficiary_id]')).to_have_value('900101-1')
    expect(page.locator('[name=insured_name]')).to_have_value('다른고객')

    page.set_viewport_size({'width': 390, 'height': 844})
    dialog = open_customer('수익자')
    dialog.get_by_label('고객 이름·연락처', exact=True).fill('없는고객')
    dialog.get_by_label('고객 이름·연락처', exact=True).press('Enter')
    expect(dialog.get_by_text('검색된 고객이 없습니다.', exact=True)).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert dialog.evaluate('(d) => d.scrollWidth <= d.clientWidth')
    dialog.get_by_role('button', name='닫기').click()
    expect(page.locator('[name=beneficiary_name]')).to_have_value('시험고객')
    assert not writes, writes
    assert not errors, errors
    browser.close()
    print('PASS: customer search/paging, partial identity, replacement clears signatures/guardians, beneficiary isolation, error retry, mobile, GET-only')
