"""Synthetic API-only Dongyang download/fax checks; start Vite on 3317."""
import io
import json
import os
import sys
from pathlib import Path
from zipfile import ZipFile
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
    {'id': '35', 'name': '시험보험', 'kind': 'LIFE', 'fax_enabled': True, 'use_virtual_fax': False, 'fax_numbers': ['021234567']},
]
PDFS = {i: generate(i, payload())[0] for i in ['13', '35']}
zipped = io.BytesIO()
with ZipFile(zipped, 'w') as archive:
    for insurer in INSURERS:
        archive.writestr(insurer['name'] + '_청구서.pdf', PDFS[insurer['id']])
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
    elif path == 'claims/requests':
        raw = request.post_data_buffer.decode()
        assert '"save_mode":"FAX"' not in raw, 'A download-only selection must never request fax'
        saves.append(raw)
        body = {'id': 80, 'save_mode': 'FILE', 'fax_history': [], 'deliveries': []}
    elif path == 'claims/original-download':
        originals.append(request.post_data_buffer.decode())
        route.fulfill(content_type='application/zip', body=zipped.getvalue(), headers=HEADERS)
        return
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=HEADERS)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, accept_downloads=True)
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
        for _ in range(3):
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
    with page.expect_download() as downloaded:
        page.get_by_role('button', name='파일만 저장', exact=True).click()
    assert Path(downloaded.value.path()).read_bytes() == zipped.getvalue()
    assert len(saves) == len(originals) == 1
    assert '"13"' in saves[0] and '"35"' in saves[0] and '"save_mode":"FILE"' in saves[0]
    assert not errors, errors
    browser.close()
    print('PASS: Dongyang-only and mixed fax disabled, no fax input, other-only fax restored, original ZIP download, mobile')
