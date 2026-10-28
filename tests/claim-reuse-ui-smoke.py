"""Synthetic reuse check; run Vite on 5179 and use the backend Python runtime."""
import hashlib
import json
import os
import re
from email.parser import BytesParser
from email.policy import default
from io import BytesIO

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright, expect
from pypdf import PdfWriter

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:5179')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}


def pdf(width, height):
    writer = PdfWriter()
    writer.add_blank_page(width, height)
    data = BytesIO()
    writer.write(data)
    return data.getvalue()


originals = [pdf(200, 300), pdf(250, 350)]
claim = {'insured_name': '테스트고객', 'insured_id': '9001011', 'insured_phone': '01012345678',
         'beneficiary_same': True, 'accident_date': '2026-10-01', 'accident_type': '질병',
         'accident_description': '검증용 사고 내용', 'bank_name': '테스트은행',
         'account_holder': '테스트고객', 'account_number': '123456789',
         'attachment_rotations': [[90], [270]], 'consent': False, 'insured_signature': ''}
detail = {'id': 1, 'insured_name': '테스트고객', 'accident_date': claim['accident_date'],
          'created_at': '2026-10-28T00:00:00Z', 'save_mode': 'FILE', 'claim': claim,
          'original_available': False, 'fax_history': [],
          'files': [{'id': i + 1, 'filename': name, 'content_type': 'application/pdf', 'size_bytes': len(data)}
                    for i, (name, data) in enumerate(zip(['first.pdf', 'second.pdf'], originals))],
          'deliveries': [{'id': 10, 'insurer_id': '35', 'insurer_name': '테스트보험', 'pages': 6, 'status': 'STORED'}]}
headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
           'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type',
           'Access-Control-Expose-Headers': 'x-claim-receipt,x-claim-pages,x-claim-fax-mode'}
generated = []


def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    body = {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'claims/insurers':
        body = {'items': [{'id': '35', 'name': '테스트보험', 'kind': 'LIFE', 'pages': 4,
                           'fax_numbers': ['021234567'], 'use_virtual_fax': False}]}
    elif path == 'claims/requests':
        body = {'items': [detail], 'page': 1, 'total_pages': 1}
    elif path == 'claims/requests/1':
        body = detail
    elif path.startswith('claims/requests/1/files/'):
        index = int(path.rsplit('/', 1)[1]) - 1
        route.fulfill(content_type='application/pdf', body=originals[index], headers=headers)
        return
    elif path == 'claims/pdf':
        raw = b'Content-Type: ' + request.headers['content-type'].encode() + b'\r\n\r\n' + request.post_data_buffer
        message = BytesParser(policy=default).parsebytes(raw)
        parts = list(message.iter_parts())
        data = json.loads(next(p.get_payload(decode=True) for p in parts
                               if p.get_param('name', header='content-disposition') == 'payload'))
        files = [p for p in parts if p.get_filename()]
        generated.append((data, [(p.get_filename(), hashlib.sha256(p.get_payload(decode=True)).hexdigest()) for p in files]))
        route.fulfill(content_type='application/pdf', body=originals[0],
                      headers={**headers, 'x-claim-receipt': 'fixture', 'x-claim-pages': '6', 'x-claim-fax-mode': 'DISABLED'})
        return
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    page = browser.new_page(viewport={'width': 1280, 'height': 1000})
    page.route('**/api/v1/**', handle)
    page.goto(BASE + '/claims/history')
    page.get_by_role('button', name='상세 보기 · 같은 내용으로 작성', exact=True).click()
    page.get_by_role('button', name='같은 내용으로 작성', exact=True).click()
    expect(page).to_have_url(BASE + '/claims/new')
    page.get_by_role('button', name='다음', exact=True).click()
    expect(page.get_by_text('기존 첨부서류 2개를 원래 순서로 불러왔습니다. PDF는 원본 방향, 사진은 저장된 회전 방향을 유지합니다. 청구서 양식은 새로 생성합니다.')).to_be_visible()
    expect(page.get_by_label('주민등록번호', exact=False).first).to_have_value('900101-1')
    page.get_by_label('주민등록번호', exact=False).first.fill('9001011234567')
    signature = Image.new('RGB', (600, 170), 'white')
    ImageDraw.Draw(signature).line((50, 100, 200, 30, 400, 120, 550, 40), fill='black', width=7)
    stream = BytesIO()
    signature.save(stream, 'PNG')
    page.get_by_label('피보험자 서명 이미지 업로드', exact=True).set_input_files(
        {'name': 'signature.png', 'mimeType': 'image/png', 'buffer': stream.getvalue()})
    expect(page.get_by_role('button', name='이미지 처리 중…')).to_have_count(0)
    page.get_by_role('button', name='다음', exact=True).click()
    expect(page.get_by_text('first.pdf', exact=True)).to_be_visible()
    expect(page.get_by_text('second.pdf', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name=re.compile('쪽 90'))).to_have_count(0)
    expect(page.get_by_text(re.compile('첨부 최대 50개 파일·합계 200MB'))).to_be_visible()
    page.get_by_role('checkbox', name=re.compile('선택한 보험사의 필수 개인정보')).check()
    page.get_by_role('button', name='PDF 생성', exact=True).click()
    page.wait_for_function('document.body.innerText.includes("PDF를 생성하지 못했습니다") || document.body.innerText.includes("6장")')
    assert len(generated) == 1
    data, files = generated[0]
    assert data['attachment_rotations'] == [[], []]
    assert files == [(name, hashlib.sha256(raw).hexdigest()) for name, raw in zip(['first.pdf', 'second.pdf'], originals)]
    assert data['insured_signature'] and data['consent']
    browser.close()
    print('PASS: history reuse restores attachment originals in order, clears legacy PDF rotations, and requests a fresh form')
