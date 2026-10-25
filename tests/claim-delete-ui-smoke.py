"""Synthetic API-only deletion checks; start Vite on 3317, use backend .venv Python."""
import json
import os
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3317')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}


def document(identifier):
    return {'id': identifier, 'insured_name': f'테스트고객{identifier}', 'accident_date': '2026-10-25',
            'created_at': '2026-10-25T00:00:00Z', 'save_mode': 'FILE', 'files': [], 'fax_history': [],
            'deliveries': [{'id': identifier, 'insurer_id': '35', 'insurer_name': '테스트보험', 'status': 'STORED', 'pages': 4}],
            'claim': {'insured_name': f'테스트고객{identifier}', 'accident_date': '2026-10-25',
                      'accident_type': '질병', 'accident_description': '테스트 사고', 'bank_name': '테스트은행', 'account_holder': '테스트'}}


records = {i: document(i) for i in range(1, 22)}
deletes, errors = [], []
fail_delete = False
hold_delete = False
held = []
HEADERS = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
           'Access-Control-Allow-Methods': 'GET,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}


def handle(route):
    req = route.request
    path = req.url.split('/api/v1/', 1)[-1].split('?')[0]
    if req.method == 'OPTIONS':
        route.fulfill(status=204, headers=HEADERS)
        return
    status, body = 200, {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'claims/insurers':
        body = {'items': []}
    elif path == 'claims/requests':
        page = int(parse_qs(urlparse(req.url).query).get('page', ['1'])[0])
        items = list(records.values())
        body = {'items': items[(page - 1) * 20:page * 20], 'total_pages': (len(items) + 19) // 20, 'page': page}
    elif path.startswith('claims/requests/'):
        identifier = int(path.split('/')[-1])
        if req.method == 'DELETE':
            deletes.append(identifier)
            if hold_delete:
                held.append(route)
                return
            if fail_delete:
                status, body = 503, {'detail': '삭제하지 못했습니다. 다시 시도해 주세요.'}
            else:
                records.pop(identifier)
                route.fulfill(status=204, headers=HEADERS)
                return
        else:
            body = records[identifier]
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body), headers=HEADERS)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/claims/history')
    page.get_by_role('button', name='다음', exact=True).click()
    expect(page.get_by_text('2 / 2', exact=True)).to_be_visible()
    page.get_by_role('button', name='삭제', exact=True).click()
    confirm = page.get_by_role('dialog', name='청구내역 삭제')
    expect(confirm).to_contain_text('테스트고객21')
    expect(confirm).to_contain_text('보관 PDF·첨부 원본·팩스 발송 이력')
    confirm.get_by_role('button', name='취소', exact=True).click()
    expect(confirm).not_to_be_visible()
    assert deletes == [] and len(records) == 21
    page.get_by_role('button', name='삭제', exact=True).click()
    fail_delete = True
    confirm.get_by_role('button', name='삭제', exact=True).click()
    expect(confirm.get_by_role('alert').filter(has_text='삭제하지 못했습니다.')).to_be_visible()
    assert len(records) == 21
    fail_delete = False
    confirm.get_by_role('button', name='삭제', exact=True).click()
    expect(confirm).not_to_be_visible()
    expect(page.get_by_role('button', name='삭제', exact=True)).to_have_count(20)
    expect(page.get_by_role('button', name='다음', exact=True)).to_have_count(0)
    assert 21 not in records

    page.get_by_role('button', name='상세 보기 · 같은 내용으로 작성', exact=True).first.click()
    detail = page.get_by_role('dialog').filter(has=page.get_by_role('heading', name='청구 상세'))
    detail.get_by_role('button', name='삭제', exact=True).click()
    hold_delete = True
    confirm.get_by_role('button', name='삭제', exact=True).click()
    expect(confirm.get_by_role('button', name='삭제 중…', exact=True)).to_be_disabled()
    expect(confirm.get_by_role('button', name='취소', exact=True)).to_be_disabled()
    page.keyboard.press('Escape')
    expect(confirm).to_be_visible()
    assert len(held) == 1
    records.pop(1)
    held.pop().fulfill(status=204, headers=HEADERS)
    hold_delete = False
    expect(confirm).not_to_be_visible()
    expect(detail).not_to_be_visible()
    expect(page.get_by_role('button', name='삭제', exact=True)).to_have_count(19)

    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='삭제', exact=True).first.click()
    expect(confirm).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert confirm.evaluate('(d) => d.scrollWidth <= d.clientWidth')
    confirm.get_by_role('button', name='취소', exact=True).click()
    records = {99: document(99)}
    page.reload()
    page.get_by_role('button', name='삭제', exact=True).click()
    confirm.get_by_role('button', name='삭제', exact=True).click()
    expect(page.get_by_text('저장된 청구 요청이 없습니다.', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name='삭제', exact=True)).to_have_count(0)
    assert not records and deletes == [21, 21, 1, 99]
    assert not errors, errors
    browser.close()
    print('PASS: list/detail delete, cancel, failure retry, busy guard, last-page fallback, empty list, mobile')
