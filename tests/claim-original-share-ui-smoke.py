"""Synthetic UI check. Start Vite and set CLAIM_UI_BASE; no real API/DB writes."""
import json
import base64
import os
import sys
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'bojogae-backend'))
from services.claim_pdf_service import generate
from tests.services.claim_pdf_service_test import payload
from services.claim_share_service import prepare_share_files

PDF = generate('35', payload())[0]
SHARED_PDF = base64.b64decode(prepare_share_files(PDF, 'test.pdf')['files'][0]['content_base64'])
MOBILE_PDFS = []
reader = PdfReader(BytesIO(SHARED_PDF))
for start in (0, 2):
    writer = PdfWriter()
    for page in reader.pages[start:start + 2]: writer.add_page(page)
    stream = BytesIO(); writer.write(stream); MOBILE_PDFS.append(stream.getvalue())


BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3329')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
ITEM = {'id': 80, 'save_mode': 'FILE', 'created_at': '2026-10-26T00:00:00Z',
        'insured_name': '시험고객', 'accident_date': '2026-10-20',
        # Deliberately different from the device clock: use server-relative expiration.
        'server_time': '2020-01-01T00:00:00Z', 'original_expires_at': '2020-01-01T01:00:00Z',
        'original_available': True,
        'deliveries': [{'id': 1, 'insurer_id': '35', 'insurer_name': '시험보험', 'status': 'STORED', 'pages': 4,
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
            if 'fax_download=true' in request.url:
                route.fulfill(content_type='application/pdf', body=SHARED_PDF, headers={**headers,  'Content-Disposition': "attachment; filename*=UTF-8''test_pc.pdf"})
                return
            assert 'share_files=true' in request.url
        body = {'monochrome': True, 'download': {'filename': 'test_pc.pdf', 'content_base64': base64.b64encode(SHARED_PDF).decode()}, 'files': [{'filename': f'test_{i}.pdf',
                           'content_base64': base64.b64encode(MOBILE_PDFS[i-1]).decode()}
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
    mobile = page.evaluate("matchMedia('(max-width: 600px), (pointer: coarse)').matches")
    share = page.get_by_role('button', name='시험보험 공유하기' if mobile else '시험보험 PDF 다운로드', exact=True)
    expect(share).to_be_enabled()
    return share


def new_context(browser, mobile):
    context = browser.new_context(viewport={'width': 390 if mobile else 1280, 'height': 900},
                                  is_mobile=mobile, has_touch=mobile, accept_downloads=True)
    context.route('**/api/v1/**', handle)
    context.add_init_script("""
      window.sharedFiles = []; window.sharedPdfBytes = [];
      Object.defineProperty(navigator, 'canShare', {configurable:true, value:()=>true});
      Object.defineProperty(navigator, 'share', {value:async({files})=>{
        window.shareHadActivation = navigator.userActivation.isActive;
        window.sharedFiles.push(files.map(f=>f.name));
        window.sharedPdfBytes.push(await Promise.all(files.map(async f=>
          btoa(Array.from(new Uint8Array(await f.arrayBuffer()),b=>String.fromCharCode(b)).join('')))));
        if(window.cancelShare) throw new DOMException('cancelled','AbortError');
      }});
    """)
    return context


def assert_pc_download(page, button):
    with page.expect_download() as event:
        button.click()
    assert event.value.suggested_filename == 'test_pc.pdf'
    assert Path(event.value.path()).read_bytes() == SHARED_PDF
    expect(button).to_be_enabled()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    # Both history actions use stored prepared files, respect device and expiry.
    for mobile in (False, True):
        context = new_context(browser, mobile)
        page = context.new_page(); page.clock.install()
        page.goto(BASE + '/claims/history')
        action = page.get_by_role('button', name='공유하기' if mobile else '다운로드', exact=True)
        expect(action).to_be_enabled()
        expect(page.get_by_role('button', name='다운로드' if mobile else '공유하기', exact=True)).to_have_count(0)
        if mobile:
            action.click(); page.wait_for_function('window.sharedPdfBytes.length === 1')
            assert page.evaluate('window.sharedFiles[0]') == ['test_1.pdf','test_2.pdf']
            assert [base64.b64decode(v) for v in page.evaluate('window.sharedPdfBytes[0]')] == MOBILE_PDFS
            assert page.evaluate('window.shareHadActivation')
        else:
            assert_pc_download(page, action)
        page.clock.fast_forward(3_600_001)
        expect(action).to_have_count(0)
        expect(page.get_by_role('button',name='보관본 다운로드',exact=True)).to_be_visible()
        context.close()

    # PC download saves once, retains the browser full-file copy, and history's
    # download returns the same whole monochrome file. No split-part download.
    context = new_context(browser, False); page = context.new_page()
    before_save = requests.count('claims/requests')
    before_prepare = requests.count('claims/share-files')
    download = create_claim(page)
    expect(page.get_by_role('button',name='시험보험 공유하기',exact=True)).to_have_count(0)
    assert_pc_download(page,download)
    assert requests.count('claims/requests')==before_save+1
    assert requests.count('claims/share-files')==before_prepare+1
    assert_pc_download(page,download)
    assert requests.count('claims/requests')==before_save+1
    assert requests.count('claims/share-files')==before_prepare+1
    page.goto(BASE+'/claims/history')
    assert_pc_download(page,page.get_by_role('button',name='다운로드',exact=True))
    context.close()

    # Mobile created PDF: prefetch exactly once; share remains in user activation;
    # saving (even on cancellation) prepares both variants for later history.
    for scenario in ('success','cancel','fallback','save_failure'):
        context = new_context(browser,True); page=context.new_page()
        before_prepare=requests.count('claims/share-files')
        share=create_claim(page)
        assert requests.count('claims/share-files')==before_prepare+1
        expect(page.get_by_role('button',name='시험보험 PDF 다운로드',exact=True)).to_have_count(0)
        if scenario=='cancel': page.evaluate('window.cancelShare=true')
        if scenario=='fallback':
            page.evaluate("Object.defineProperty(navigator,'canShare',{value:()=>false})")
        if scenario=='save_failure':
            context.route('**/api/v1/claims/requests',lambda route:route.fulfill(status=503,
                content_type='application/json',headers=headers,body=json.dumps({'detail':'검증용 저장 실패'})))
        before_save=requests.count('claims/requests')
        share.click()
        if scenario=='save_failure':
            expect(page.get_by_role('alert').filter(has_text='검증용 저장 실패').first).to_be_visible()
        else:
            expect(page.get_by_role('status').filter(has_text='청구 요청 80번이 저장되었습니다.')).to_be_visible()
            assert requests.count('claims/requests')==before_save+1
            expect(share).to_be_enabled();share.click();expect(share).to_be_enabled()
            assert requests.count('claims/requests')==before_save+1
        if scenario!='fallback':
            page.wait_for_function('window.sharedPdfBytes.length >= 1')
            assert page.evaluate('window.shareHadActivation')
            assert [base64.b64decode(v) for v in page.evaluate('window.sharedPdfBytes[0]')] == MOBILE_PDFS
        assert requests.count('claims/share-files')==before_prepare+1
        if scenario=='success':
            page.goto(BASE+'/claims/history')
            action=page.get_by_role('button',name='공유하기',exact=True)
            expect(action).to_be_enabled();action.click()
            page.wait_for_function('window.sharedPdfBytes.length === 1')
            assert [base64.b64decode(v) for v in page.evaluate('window.sharedPdfBytes[0]')] == MOBILE_PDFS
        context.close()

    # Failure cannot save a new request or leak a color original; retries work.
    context=new_context(browser,False)
    context.route('**/api/v1/claims/share-files',lambda route:route.fulfill(status=503,
        content_type='application/json',headers=headers,body=json.dumps({'detail':'검증용 변환 실패'})))
    page=context.new_page(); download=create_claim(page);downloads=[]
    page.on('download',lambda item:downloads.append(item))
    before_save=requests.count('claims/requests')
    download.click()
    expect(page.get_by_role('alert').filter(has_text='검증용 변환 실패')).to_be_visible()
    assert not downloads and requests.count('claims/requests')==before_save
    context.unroute('**/api/v1/claims/share-files')
    context.route('**/api/v1/claims/share-files',lambda route:route.fulfill(
        content_type='application/json',headers=headers,body=json.dumps({'files':[]})))
    download.click()
    expect(page.get_by_role('alert').filter(has_text='흑백 PDF를 준비하지 못했습니다.')).to_be_visible()
    assert not downloads and requests.count('claims/requests')==before_save
    context.unroute('**/api/v1/claims/share-files')
    assert_pc_download(page,download)
    assert len(downloads)==1 and requests.count('claims/requests')==before_save+1
    context.close();browser.close()
print('PC full download/mobile split share, action save, history reuse, one-hour expiry, cache and failure: passed')
