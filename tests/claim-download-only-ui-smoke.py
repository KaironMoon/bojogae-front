"""Synthetic API-only Dongyang download/fax checks; start Vite on 3317."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'bojogae-backend'))
from tests.services.claim_pdf_service_test import payload
from services.claim_pdf_service import generate

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3317')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
INSURERS = [
    {'id': '13', 'name': '동양생명', 'kind': 'LIFE', 'fax_enabled': False,
     'fax_disabled_reason': '동양생명은 다운로드만 지원합니다.', 'use_virtual_fax': False, 'fax_numbers': []},
    {'id': '35', 'name': '시험보험', 'kind': 'LIFE', 'fax_enabled': True, 'use_virtual_fax': False, 'fax_numbers': ['021234567'], 'customer_center_phone': '1588-0000'},
]
PDFS = {i: generate(i, payload())[0] for i in ['13', '35']}
errors, saves, originals = [], [], []
HEADERS = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
           'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type',
           'Access-Control-Expose-Headers': 'X-Claim-Receipt,X-Claim-Pages,Content-Disposition'}


def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=HEADERS)
        return
    body = {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'claims/insurers':
        body = {'items': INSURERS}
    elif path == 'claims/pdf':
        from email.parser import BytesParser
        from email.policy import default
        content_type = request.headers['content-type']
        message = BytesParser(policy=default).parsebytes(('Content-Type: ' + content_type + '\r\n\r\n').encode() + request.post_data_buffer)
        fields = {part.get_param('name', header='content-disposition'): part.get_payload(decode=True) for part in message.iter_parts()}
        identifier = fields['insurer_id'].decode()
        route.fulfill(content_type='application/pdf', body=PDFS[identifier],
                      headers={**HEADERS, 'X-Claim-Receipt': 'synthetic', 'X-Claim-Pages': str(5 if identifier == '13' else 4)})
        return
    elif path == 'claims/requests' and request.method == 'GET':
        body = {'items': [], 'total': 0, 'page': 1, 'page_size': 20}
    elif path == 'claims/requests':
        raw = request.post_data_buffer.decode()
        assert '"save_mode":"FAX"' not in raw, 'A download-only selection must never request fax'
        saves.append(raw)
        body = {'id': 80, 'save_mode': 'FILE', 'fax_history': [], 'deliveries': []}
    elif path == 'claims/original-download':
        from email.parser import BytesParser
        from email.policy import default
        message = BytesParser(policy=default).parsebytes(
            ('Content-Type: ' + request.headers['content-type'] + '\r\n\r\n').encode() + request.post_data_buffer)
        fields = {part.get_param('name', header='content-disposition'): part.get_payload(decode=True) for part in message.iter_parts()}
        submission = json.loads(fields['payload'])
        originals.append(submission)
        assert len(submission['insurer_ids']) == 1
        identifier = submission['insurer_ids'][0]
        from urllib.parse import quote
        filename = next(i['name'] for i in INSURERS if i['id'] == identifier) + '_청구서.pdf'
        route.fulfill(content_type='application/pdf', body=PDFS[identifier],
                      headers={**HEADERS, 'Content-Disposition': "attachment; filename*=UTF-8''" + quote(filename)})
        return
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=HEADERS)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, accept_downloads=True)
    context.add_init_script("""Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });""")
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/claims/new')
    dongyang = page.get_by_role('checkbox', name='동양생명 · 다운로드 전용', exact=True)
    dongyang.check()
    expect(page.get_by_role('alert').filter(has_text='팩스를 발송하려면 해당 보험사를 선택 해제')).to_be_visible()
    page.get_by_role('button', name='다음', exact=True).click()
    page.locator('[name=insured_name]').fill('시험고객')
    page.locator('[name=insured_id]').fill('900101-1000000')
    page.locator('[name=insured_phone]').fill('010-1234-5678')
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

    def generate_and_check(count, disabled):
        page.get_by_role('button', name='PDF 생성', exact=True).click()
        expect(page.get_by_text(f'생성된 PDF {count}건', exact=True)).to_be_visible()
        fax = page.get_by_role('button', name='팩스 발송', exact=True)
        if disabled:
            expect(fax).to_be_disabled()
        else:
            expect(fax).to_be_enabled()
        expect(page.get_by_role('button', name='파일만 저장', exact=True)).to_be_enabled()

    def back_to_insurers():
        page.get_by_role('button', name='이전', exact=True).click()
        expect(page.get_by_role('dialog')).to_contain_text('주민등록번호가 마스킹되지 않은 원본 PDF')
        page.get_by_role('button', name='머무르기', exact=True).click()
        expect(page.get_by_text('생성된 PDF')).to_be_visible()
        page.get_by_role('button', name='이전', exact=True).click()
        page.get_by_role('button', name='나가기', exact=True).click()
        for _ in range(2):
            page.get_by_role('button', name='이전', exact=True).click()

    def next_to_details():
        for _ in range(2):
            page.get_by_role('button', name='다음', exact=True).click()

    generate_and_check(1, True)
    expect(page.get_by_text('다운로드 전용', exact=True)).to_be_visible()
    expect(page.get_by_text('보험사에서 가상팩스 번호를 발급받아 주세요.', exact=True)).to_have_count(0)
    expect(page.get_by_label('동양생명 가상팩스 번호', exact=True)).to_have_count(0)
    back_to_insurers()
    page.get_by_role('checkbox', name='시험보험', exact=True).check()
    next_to_details()
    generate_and_check(2, True)
    back_to_insurers()
    dongyang.uncheck()
    next_to_details()
    generate_and_check(1, False)
    back_to_insurers()
    dongyang.check()
    next_to_details()
    generate_and_check(2, True)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    # Unsupported mobile browsers keep individual PDF downloads available.
    with page.expect_download() as downloaded:
        page.get_by_role('button', name='동양생명 PDF 다운로드', exact=True).click()
    assert Path(downloaded.value.path()).read_bytes() == PDFS['13']
    assert downloaded.value.suggested_filename == '동양생명_청구서.pdf'
    assert not saves
    expect(page.get_by_role('img', name='동양생명 청구서 1쪽 미리보기')).to_be_visible()
    expect(page.get_by_role('img', name='시험보험 청구서 1쪽 미리보기')).to_be_visible()
    assert page.evaluate("""() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event); return event.defaultPrevented;
    }""")
    # Emulate OS sharing to verify exactly one named PDF per insurer and cancel/failure handling.
    page.evaluate("""() => {
        window.shared = [];
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: ({files}) => files[0].type === 'application/pdf' });
        Object.defineProperty(navigator, 'share', { configurable: true, value: async ({files}) => {
            if (window.shareError) throw new DOMException('synthetic', window.shareError);
            window.shared.push({name: files[0].name, type: files[0].type, size: files[0].size});
        }});
    }""")
    # Force media-query re-evaluation after installing the synthetic capability.
    page.set_viewport_size({'width': 800, 'height': 1000})
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    page.set_viewport_size({'width': 390, 'height': 844})
    for name in ['동양생명', '시험보험']:
        page.get_by_role('button', name=name + ' 공유하기', exact=True).click()
    assert page.evaluate('window.shared') == [
        {'name': i['name'] + '_청구서.pdf', 'type': 'application/pdf', 'size': len(PDFS[i['id']])} for i in INSURERS]
    page.evaluate("window.shareError = 'AbortError'")
    page.get_by_role('button', name='시험보험 공유하기', exact=True).click()
    expect(page.get_by_role('button', name='시험보험 공유하기', exact=True)).to_be_enabled()
    expect(page.get_by_text('공유창을 열지 못했습니다.', exact=False)).to_have_count(0)
    page.evaluate("window.shareError = 'NotAllowedError'")
    page.get_by_role('button', name='시험보험 공유하기', exact=True).click()
    expect(page.get_by_role('button', name='시험보험 PDF 다운로드', exact=True)).to_be_visible()
    page.evaluate('window.shareError = null')
    expect(page.get_by_role('img', name='동양생명 청구서 1쪽 미리보기')).to_be_visible()
    expect(page.get_by_role('img', name='시험보험 청구서 1쪽 미리보기')).to_be_visible()
    page.screenshot(path=str(ROOT / 'tmp/claim-individual-mobile.png'), full_page=True)
    # Saving keeps a single archive request, but fetches two separate original PDFs.
    downloads = []
    page.on('download', lambda download: downloads.append(download))
    with page.expect_download(predicate=lambda d: d.suggested_filename == '동양생명_청구서.pdf'):
        page.get_by_role('button', name='파일만 저장', exact=True).click()
    expect(page.get_by_role('button', name='발송용 원본 다운로드', exact=True)).to_be_enabled()
    assert sorted(d.suggested_filename for d in downloads) == sorted(i['name'] + '_청구서.pdf' for i in INSURERS)
    for download in downloads:
        insurer = next(i for i in INSURERS if i['name'] + '_청구서.pdf' == download.suggested_filename)
        assert Path(download.path()).read_bytes() == PDFS[insurer['id']]
    assert len(saves) == 1 and len(originals) == 2
    assert '"13"' in saves[0] and '"35"' in saves[0] and '"save_mode":"FILE"' in saves[0]
    # SPA navigation warns even after saving; cancelling retains both originals.
    page.get_by_role('link', name='청구내역 보기', exact=True).click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.get_by_role('button', name='머무르기', exact=True).click()
    expect(page.get_by_text('생성된 PDF 2건', exact=True)).to_be_visible()
    page.get_by_role('link', name='청구내역 보기', exact=True).click()
    page.get_by_role('button', name='나가기', exact=True).click()
    expect(page).to_have_url(BASE + '/claims/history')
    page.go_back()
    expect(page.get_by_role('group', name='청구할 보험사')).to_be_visible()
    expect(page.get_by_text('생성된 PDF 2건', exact=True)).to_have_count(0)
    assert not page.evaluate("""() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event); return event.defaultPrevented;
    }""")
    assert not errors, errors
    browser.close()
    print('PASS: separate insurer PDFs, inline previews, mobile share/cancel/fallback, save, leave/stay and original cleanup')
