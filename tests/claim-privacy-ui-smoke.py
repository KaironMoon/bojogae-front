"""Synthetic API-only privacy flow. Start Vite on 3317; run using backend .venv Python."""
import io
import json
import os
import sys
from pathlib import Path
from zipfile import ZipFile
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'bojogae-backend'))
from tests.services.claim_pdf_service_test import payload, signature
from services.claim_pdf_service import generate, generate_archive

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3317')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
CLAIM = payload(beneficiary_same=False, beneficiary_name='수익자', beneficiary_id='9202022000000',
                beneficiary_phone='01012345678', beneficiary_signature=signature(),
                insured_guardian_name='보호자', insured_guardian_relationship='모',
                insured_guardian_phone='01012345678', insured_guardian_signature=signature(),
                beneficiary_guardian_name='수익자보호자', beneficiary_guardian_relationship='부',
                beneficiary_guardian_phone='01012345678', beneficiary_guardian_signature=signature()).model_dump(mode='json')
DELIVERIES = [{'id': 1, 'insurer_id': '35', 'insurer_name': '시험보험', 'pages': 4, 'status': 'STORED'},
              {'id': 2, 'insurer_id': '3', 'insurer_name': '다른보험', 'pages': 4, 'status': 'STORED'}]
DETAIL = {'id': 1, 'claim': CLAIM, 'created_at': '2026-10-25T00:00:00Z', 'save_mode': 'FILE',
          'files': [{'id': 8, 'filename': '첨부원본.pdf', 'content_type': 'application/pdf', 'size_bytes': 100}],
          'deliveries': DELIVERIES, 'fax_history': []}
ORIGINAL = generate('35', payload(**CLAIM))[0]
ARCHIVE = generate_archive('35', CLAIM)[0]
zipped = io.BytesIO()
with ZipFile(zipped, 'w') as zip_file:
    zip_file.writestr('시험보험_청구서.pdf', ORIGINAL)
    zip_file.writestr('다른보험_청구서.pdf', ORIGINAL)
errors, original_requests, archive_requests, posts = [], [], [], []


def handle(route):
    req = route.request
    path = req.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
               'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type',
               'Access-Control-Expose-Headers': 'X-Claim-Receipt,X-Claim-Pages,Content-Disposition'}
    if req.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    body = {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'claims/insurers':
        body = {'items': [{'id': d['insurer_id'], 'name': d['insurer_name'], 'kind': 'DAMAGE',
                           'use_virtual_fax': False, 'fax_numbers': ['021234567']} for d in DELIVERIES]}
    elif path == 'claims/requests' and req.method == 'GET':
        body = {'items': [{**DETAIL, 'insured_name': CLAIM['insured_name'], 'accident_date': CLAIM['accident_date']}], 'total_pages': 1}
    elif path == 'claims/requests/1':
        body = DETAIL
    elif path == 'claims/requests/1/download':
        archive_requests.append(path)
        route.fulfill(content_type='application/pdf', body=ARCHIVE, headers=headers)
        return
    elif path == 'claims/requests/1/files/8':
        route.fulfill(content_type='application/pdf', body=ORIGINAL, headers=headers)
        return
    elif path == 'claims/pdf':
        route.fulfill(content_type='application/pdf', body=ORIGINAL,
                      headers={**headers, 'X-Claim-Receipt': 'synthetic-receipt', 'X-Claim-Pages': '5'})
        return
    elif path == 'claims/requests' and req.method == 'POST':
        posts.append(req.post_data_buffer.decode(errors='replace'))
        safe = {**CLAIM, 'insured_id': CLAIM['insured_id'][:7], 'beneficiary_id': CLAIM['beneficiary_id'][:7], 'consent': False}
        for key in safe:
            if key.endswith('_signature'):
                safe[key] = ''
        body = {**DETAIL, 'claim': safe, 'id': 2}
    elif path == 'claims/original-download':
        original_requests.append(req.post_data_buffer.decode(errors='replace'))
        route.fulfill(content_type='application/zip', body=zipped.getvalue(), headers=headers)
        return
    elif '/files/' in path and 'pdf=true' in req.url:
        route.fulfill(content_type='application/pdf', body=ARCHIVE, headers=headers)
        return
    elif path.endswith('/fax'):
        raise AssertionError('History must never request fax sending')
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, accept_downloads=True)
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/claims/history')
    expect(page.get_by_role('button', name='팩스 발송', exact=True)).to_have_count(0)
    expect(page.get_by_role('button', name='팩스 재발송', exact=True)).to_have_count(0)
    page.get_by_role('button', name='파일 다운로드', exact=True).click()
    warning = page.get_by_role('dialog', name='파일 다운로드 안내')
    expect(warning).to_contain_text('이 파일을 그대로 발송하시면 안 됩니다.')
    assert not archive_requests
    warning.get_by_role('button', name='취소', exact=True).click()
    assert not archive_requests
    page.get_by_role('button', name='파일 다운로드', exact=True).click()
    with page.expect_download() as downloaded:
        warning.get_by_role('button', name='확인 후 다운로드', exact=True).click()
    assert Path(downloaded.value.path()).read_bytes() == ARCHIVE
    assert len(archive_requests) == 1
    page.get_by_role('button', name='상세 보기 · 같은 내용으로 작성', exact=True).click()
    detail = page.get_by_role('dialog').filter(has=page.get_by_role('heading', name='청구 상세'))
    expect(detail.get_by_role('button', name='팩스 발송', exact=True)).to_have_count(0)
    expect(detail.get_by_role('button', name='팩스 재발송', exact=True)).to_have_count(0)
    detail.get_by_role('button', name='첨부원본.pdf', exact=True).click()
    expect(warning).to_contain_text('첨부파일은 원본입니다.')
    warning.get_by_role('button', name='취소', exact=True).click()
    detail.get_by_role('button', name='같은 내용으로 작성', exact=True).click()
    page.get_by_role('button', name='다음', exact=True).click()
    expect(page.locator('[name=insured_id]')).to_have_value('900101-1')
    expect(page.locator('[name=beneficiary_id]')).to_have_value('920202-2')
    is_signed = """c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0)"""
    for label in ['피보험자', '수익자', '피보험자 법정대리인', '수익자 법정대리인']:
        canvas = page.get_by_role('img', name=label + ' 서명 입력 영역', exact=True)
        assert not canvas.evaluate(is_signed), label
        canvas.scroll_into_view_if_needed()
        box = canvas.bounding_box()
        page.mouse.move(box['x'] + 20, box['y'] + 20)
        page.mouse.down()
        page.mouse.move(box['x'] + 80, box['y'] + 60, steps=5)
        page.mouse.up()
    page.locator('[name=insured_id]').fill('900101-1000000')
    page.locator('[name=beneficiary_id]').fill('920202-2000000')
    page.get_by_role('button', name='다음', exact=True).click()
    expect(page.get_by_text('첨부원본.pdf', exact=True)).to_be_visible()
    consent = page.get_by_role('checkbox', name='선택한 보험사의 필수 개인정보 동의서를 확인했으며, 서명자의 동의에 따라 PDF에 동의 표시와 서명을 반영합니다.', exact=True)
    expect(consent).not_to_be_checked()
    consent.check()
    page.get_by_role('button', name='PDF 생성', exact=True).click()
    expect(page.get_by_text('생성된 PDF 2건', exact=True)).to_be_visible()
    with page.expect_download() as original_download:
        page.get_by_role('button', name='파일만 저장', exact=True).click()
    assert Path(original_download.value.path()).read_bytes() == zipped.getvalue()
    assert len(archive_requests) == 1 and len(original_requests) == 1 and len(posts) == 1
    assert '첨부원본.pdf' in posts[0] and '"insured_id":"900101-1000000"' in posts[0]
    page.set_viewport_size({'width': 390, 'height': 844})
    expect(page.get_by_role('button', name='발송용 원본 다운로드', exact=True)).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert not errors, errors
    browser.close()
    print('PASS: warning confirm/cancel, history fax removal, partial identity/four signatures reset, original attachments restored, immediate original ZIP download, mobile')
