"""Run Vite on 3397. All customer updates use synthetic intercepted API calls."""
import json
import os
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CRM_UI_BASE', 'http://127.0.0.1:3397')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD', 'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
customers = [{'id': i, 'name': f'시험{i}', 'version': i, 'archived': False, 'stage': 'UNCONTACTED', 'phone': '01000000001', 'location': {'address': '서울'}, 'contract_count': 1} for i in range(1, 6)]
writes, errors = [], []
fail_next = False


def handle(route):
    global fail_next
    request = route.request
    path = urlparse(request.url).path.split('/api/v1/')[-1]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    status, body = 200, {}
    if path == 'auth/me': body = USER
    elif path == 'web-push/configuration': body = {'enabled': False}
    elif path == 'crm/customers':
        query = parse_qs(urlparse(request.url).query)
        archived = query.get('archived') == ['true']
        page = int(query.get('page', ['1'])[0])
        q = query.get('q', [''])[0]
        items = [c for c in customers if c['archived'] == archived and (not q or q in c['name'])]
        body = {'items': items[(page-1)*2:page*2], 'total': len(items), 'page': page, 'page_size': 2}
    elif path == 'crm/customers/bulk-archive':
        data = request.post_data_json
        writes.append(data)
        if fail_next:
            fail_next = False
            status, body = 409, {'detail': 'crm_version_conflict'}
        else:
            assert data['confirmed'] is True
            for item in data['customers']:
                customer = next(c for c in customers if c['id'] == item['id'])
                assert customer['version'] == item['version']
                customer['archived'] = True
                customer['version'] += 1
            body = {'count': len(data['customers']), 'ids': [c['id'] for c in data['customers']]}
    elif request.method != 'GET':
        raise AssertionError('Unexpected mutation: ' + path)
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/crm/customers')
    archive = page.get_by_role('button', name='선택 고객 보관', exact=True)
    select_all = page.get_by_role('checkbox', name='현재 페이지 전체 선택', exact=True)
    expect(archive).to_be_disabled()
    page.get_by_role('checkbox', name='시험1 고객 선택', exact=True).check()
    expect(page.get_by_text('선택 1명', exact=True)).to_be_visible()
    select_all.check()
    expect(page.get_by_text('선택 2명', exact=True)).to_be_visible()
    page.get_by_role('checkbox', name='시험1 고객 선택', exact=True).uncheck()
    assert select_all.evaluate('(input) => input.getAttribute("data-indeterminate")') == 'true'
    archive.click()
    dialog = page.get_by_role('dialog')
    expect(dialog.get_by_text('선택한 고객 1명을 보관할까요?', exact=True)).to_be_visible()
    expect(dialog.get_by_text('시험2', exact=True)).to_be_visible()
    dialog.get_by_role('button', name='취소', exact=True).click()
    assert not writes
    page.get_by_role('button', name='Go to page 2', exact=True).click()
    expect(page.get_by_role('checkbox', name='시험3 고객 선택', exact=True)).to_be_visible()
    expect(page.get_by_text('선택 0명', exact=True)).to_be_visible()
    select_all.check()
    fail_next = True
    archive.click()
    dialog.get_by_role('button', name='보관', exact=True).click()
    expect(dialog.get_by_role('alert')).to_contain_text('새로고침')
    assert not any(c['archived'] for c in customers)
    dialog.get_by_role('button', name='취소', exact=True).click()
    archive.click()
    dialog.get_by_role('button', name='보관', exact=True).click()
    expect(page.get_by_text('2명의 고객을 보관했습니다.', exact=True)).to_be_visible()
    expect(page.get_by_role('checkbox', name='시험1 고객 선택', exact=True)).to_be_visible()
    expect(page.get_by_text('선택 0명', exact=True)).to_be_visible()
    assert writes[-1]['customers'] == [{'id': 3, 'version': 3}, {'id': 4, 'version': 4}]
    page.get_by_role('checkbox', name='시험1 고객 선택', exact=True).check()
    page.get_by_label('이름·카톡대화명·연락처·주소·메모 검색', exact=True).fill('시험1')
    page.get_by_role('button', name='검색', exact=True).click()
    expect(page.get_by_text('선택 0명', exact=True)).to_be_visible()
    # Clear the query before viewing the archived customers.
    page.get_by_label('이름·카톡대화명·연락처·주소·메모 검색', exact=True).fill('')
    page.get_by_role('button', name='검색', exact=True).click()
    page.get_by_label('보기', exact=True).click()
    page.get_by_role('option', name='보관 고객', exact=True).click()
    expect(page.get_by_role('link', name='시험3', exact=True)).to_be_visible()
    expect(archive).to_have_count(0)
    expect(select_all).to_have_count(0)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert not errors, errors
    assert len(writes) == 2
    browser.close()
    print('PASS: row/page selection, cancel, page/filter reset, version conflict, confirmed batch archive, last-row paging, archived list and mobile; synthetic API only')
