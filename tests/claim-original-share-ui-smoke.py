"""Synthetic UI check. Start Vite and set CLAIM_UI_BASE; no real API/DB writes."""
import json
import base64
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'bojogae-backend'))
from services.claim_pdf_service import generate
from tests.services.claim_pdf_service_test import payload

PDF = generate('35', payload())[0]

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3329')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
ITEM = {'id': 80, 'save_mode': 'FILE', 'created_at': '2026-10-26T00:00:00Z',
        'insured_name': '시험고객', 'accident_date': '2026-10-20',
        # Deliberately different from the device clock: use server-relative expiration.
        'server_time': '2020-01-01T00:00:00Z', 'original_expires_at': '2020-01-01T01:00:00Z',
        'original_available': True,
        'deliveries': [{'id': 1, 'insurer_name': '시험보험', 'status': 'STORED', 'pages': 4,
                        'fax_number': '02-123-4567', 'fax_type': 'COMMON'}]}
headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
           'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type',
           'Access-Control-Expose-Headers': 'Content-Disposition'}
requests = []


def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    requests.append(path)
    body = {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'claims/insurers':
        body = {'items': [{'id': '35', 'name': '시험보험', 'kind': 'LIFE', 'fax_enabled': True,
                          'use_virtual_fax': False, 'fax_numbers': ['02-123-4567']}]}
    elif path == 'claims/pdf':
        route.fulfill(content_type='application/pdf', body=PDF,
                      headers={**headers, 'Access-Control-Expose-Headers': 'X-Claim-Receipt,X-Claim-Pages',
                               'X-Claim-Receipt': 'synthetic', 'X-Claim-Pages': '4'})
        return
    elif path == 'claims/requests' and request.method == 'POST':
        assert b'"save_mode":"FILE"' in request.post_data_buffer
        body = {**ITEM, 'fax_history': []}
    elif path == 'claims/requests':
        body = {'items': [ITEM], 'page': 1, 'total_pages': 1}
    elif path == 'claims/requests/80':
        body = {**ITEM, 'claim': payload().model_dump(mode='json'), 'files': [],
                'fax_history': [{'id': 1, 'insurer_name': '시험보험', 'fax_number': '02-123-4567',
                                 'status': 'FAILED', 'requested_at': ITEM['created_at']}]}
    elif path in ('claims/requests/80/originals/1', 'claims/share-files'):
        if path.endswith('/originals/1'):
            assert 'share_files=true' in request.url
        body = {'files': [{'filename': f'test_{i}.pdf',
                           'content_base64': base64.b64encode(PDF).decode()}
                          for i in (1, 2)]}
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=headers)


def create_claim(page):
    page.goto(BASE + '/claims/new')
    page.get_by_role('checkbox', name='시험보험', exact=True).check()
    page.get_by_role('button', name='다음', exact=True).click()
    for key, value in {'insured_name': '시험고객', 'insured_id': '900101-1000000',
                       'insured_phone': '01012345678'}.items():
        page.locator(f'[name={key}]').fill(value)
    canvas = page.get_by_role('img', name='피보험자 서명 입력 영역', exact=True)
    canvas.scroll_into_view_if_needed()
    box = canvas.bounding_box()
    page.mouse.move(box['x'] + 20, box['y'] + 20)
    page.mouse.down()
    page.mouse.move(box['x'] + 80, box['y'] + 60, steps=5)
    page.mouse.up()
    page.get_by_role('button', name='다음', exact=True).click()
    for key, value in {'accident_date': '2026-01-01', 'accident_description': '시험 사고',
                       'bank_name': '시험은행', 'account_number': '123456789', 'account_holder': '시험고객'}.items():
        page.locator(f'[name={key}]').fill(value)
    page.get_by_role('checkbox').check()
    page.get_by_role('button', name='PDF 생성', exact=True).click()
    share = page.get_by_role('button', name='시험보험 공유하기', exact=True)
    expect(share).to_be_enabled()
    return share


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    for mobile in (False, True):
        context = browser.new_context(viewport={'width': 390 if mobile else 1280, 'height': 900},
                                      is_mobile=mobile, has_touch=mobile)
        context.route('**/api/v1/**', handle)
        context.add_init_script("""
            window.sharedFiles = [];
            Object.defineProperty(navigator, 'canShare', {value: () => true});
            Object.defineProperty(navigator, 'share', {value: async ({files}) => {
              window.sharedFiles.push(files.map(file => file.name));
            }});
        """)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.clock.install()
        page.goto(BASE + '/claims/history')
        share = page.get_by_role('button', name='공유하기', exact=True)
        expect(share).to_be_enabled()
        expect(page.get_by_text('약 60분 남음', exact=True)).to_be_visible()
        before = len(requests)
        share.click()
        if mobile:
            assert page.evaluate('window.sharedFiles') == [['test_1.pdf', 'test_2.pdf']]
            expect(page.get_by_text('8MB 미만의 PDF 2개로 나눴습니다.', exact=False)).to_be_visible()
            # No fetch between the click and navigator.share: Safari activation is retained.
            assert len(requests) == before
        else:
            expect(page.get_by_role('status').filter(has_text='공유되었습니다. 모바일에서 청구내역에 있는 공유버튼을 눌러주세요')).to_be_visible()
            assert page.evaluate('window.sharedFiles') == []
        page.clock.fast_forward(1_800_000)
        expect(page.get_by_text('약 30분 남음', exact=True)).to_be_visible()
        page.clock.fast_forward(1_770_000)
        expect(page.get_by_text('1분 미만 남음', exact=True)).to_be_visible()
        page.clock.fast_forward(30_001)
        expect(share).to_have_count(0)
        expect(page.get_by_text('1분 미만 남음', exact=True)).to_have_count(0)
        expect(page.get_by_role('button', name='파일 다운로드', exact=True)).to_be_visible()
        assert not errors, errors
        context.close()
    # A failed preparation can be retried without creating another share button.
    context = browser.new_context(viewport={'width': 390, 'height': 900}, is_mobile=True, has_touch=True)
    context.route('**/api/v1/**', handle)
    context.route('**/api/v1/claims/requests/80/originals/1?*', lambda route: route.fulfill(
        status=503, content_type='application/json', headers=headers,
        body=json.dumps({'detail': '검증용 준비 실패'})))
    page = context.new_page()
    page.goto(BASE + '/claims/history')
    retry = page.get_by_role('button', name='공유하기', exact=True)
    expect(page.get_by_text('검증용 준비 실패', exact=True)).to_be_visible()
    expect(retry).to_be_enabled()
    context.unroute('**/api/v1/claims/requests/80/originals/1?*')
    retry.click()
    expect(retry).to_have_text('공유하기')
    expect(retry).to_be_enabled()
    expect(page.get_by_text('8MB 미만의 PDF 2개로 나눴습니다.', exact=False)).to_be_visible()
    context.close()

    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    context.add_init_script("""
        window.copiedNumbers = [];
        Object.defineProperty(navigator, 'clipboard', {value: {
          writeText: async text => window.copiedNumbers.push(text)
        }});
    """)
    page = context.new_page()
    share = create_claim(page)
    before = requests.count('claims/requests')
    share.click()
    expect(page.get_by_role('status').filter(has_text='공유되었습니다. 모바일에서 청구내역에 있는 공유버튼을 눌러주세요')).to_be_visible()
    assert requests.count('claims/requests') == before + 1
    share.click()
    assert requests.count('claims/requests') == before + 1, 'Repeated share must reuse the original expiry'
    page.get_by_role('button', name='시험보험 팩스번호 02-123-4567 복사', exact=True).click()
    expect(page.get_by_role('alert').filter(has_text='팩스번호가 복사되었습니다.')).to_be_visible()
    page.get_by_role('button', name='시험보험 팩스번호 복사 아이콘', exact=True).click()
    assert page.evaluate('window.copiedNumbers') == ['021234567', '021234567']
    page.goto(BASE + '/claims/history')
    page.get_by_role('button', name='상세 보기 · 같은 내용으로 작성', exact=True).click()
    page.get_by_role('button', name='시험보험 팩스번호 02-123-4567 복사', exact=True).click()
    page.get_by_role('button', name='시험보험 발송 팩스번호 복사 아이콘', exact=True).click()
    assert page.evaluate('window.copiedNumbers') == ['021234567', '021234567']
    context.close()
    for scenario in ('success', 'cancel', 'download', 'save_failure'):
        context = browser.new_context(viewport={'width': 390, 'height': 900}, is_mobile=True, has_touch=True)
        context.route('**/api/v1/**', handle)
        context.add_init_script("""
            window.sharedFiles = [];
            Object.defineProperty(navigator, 'canShare', {value: () => true, configurable: true});
            Object.defineProperty(navigator, 'share', {value: async ({files}) => {
                window.shareHadActivation = navigator.userActivation.isActive;
                window.sharedFiles.push(files.map(file => file.name));
                if (window.cancelShare) throw new DOMException('Cancelled', 'AbortError');
            }});
        """)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        share = create_claim(page)
        if scenario in ('cancel', 'save_failure'):
            page.evaluate('window.cancelShare = true')
        if scenario == 'download':
            page.evaluate("Object.defineProperty(navigator, 'canShare', {value: () => false})")
        if scenario == 'save_failure':
            context.route('**/api/v1/claims/requests', lambda route: route.fulfill(
                status=500, content_type='application/json', headers=headers,
                body=json.dumps({'detail': '검증용 저장 실패'})))
        before = requests.count('claims/requests')
        share.click()
        if scenario == 'save_failure':
            expect(page.get_by_role('alert').filter(has_text='검증용 저장 실패').first).to_be_visible()
            expect(page.get_by_role('status').filter(has_text='청구 요청 80번이 저장되었습니다.')).to_have_count(0)
        else:
            expect(page.get_by_role('status').filter(has_text='청구 요청 80번이 저장되었습니다.')).to_be_visible()
            assert requests.count('claims/requests') == before + 1, scenario
            expect(share).to_be_enabled()
            share.click()
            expect(share).to_be_enabled()
            assert requests.count('claims/requests') == before + 1, 'Repeated mobile share must reuse the saved claim'
        if scenario == 'download':
            assert page.evaluate('window.sharedFiles') == []
            expect(page.get_by_role('status').filter(has_text='이 브라우저는 파일 공유를 지원하지 않습니다.')).to_be_visible()
        else:
            assert page.evaluate('window.shareHadActivation'), scenario
            assert page.evaluate('window.sharedFiles.length') >= 1, scenario
            assert page.evaluate('window.sharedFiles[0]') == ['test_1.pdf', 'test_2.pdf']
        assert not errors, errors
        context.close()
    browser.close()
print('PC/mobile share, mobile save/cancel/fallback/failure/deduplication, expiry and fax copy: passed')
