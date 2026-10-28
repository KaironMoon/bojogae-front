"""Synthetic fax pricing/rotation UI. All API traffic is intercepted; no send or DB writes."""
import io
import json
import os
import sys
from email.parser import BytesParser
from email.policy import default
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright, expect
from pypdf import PdfReader
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'bojogae-backend'))
from tests.services.claim_pdf_service_test import payload
from services.claim_pdf_service import generate
from services.fax_billing import fax_cost
from services.insurer_service import seed_records
from services.claim_share_service import prepare_share_files

BASE = os.environ.get('CLAIM_UI_BASE', 'http://127.0.0.1:3318')
OUT = ROOT / 'tmp/fax-pricing-check'
OUT.mkdir(parents=True, exist_ok=True)
image = Image.new('RGB', (2400, 1200), 'white')
ImageDraw.Draw(image).text((40, 40), 'TOP - image rotation test', fill='black', font_size=64)
img = io.BytesIO(); image.save(img, 'PNG')
pdf = io.BytesIO(); canvas = Canvas(pdf, pagesize=(300, 500))
for page in range(12):
    canvas.drawString(30, 450, f'TOP - attachment page {page + 1}')
    canvas.showPage()
canvas.save()
headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
           'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type',
           'Access-Control-Expose-Headers': 'X-Claim-Receipt,X-Claim-Pages,X-Claim-Fax-Cost,X-Claim-Fax-Mode'}
errors, sent, generated = [], [], []

def multipart(request):
    message = BytesParser(policy=default).parsebytes(('Content-Type: '+request.headers['content-type']+'\r\n\r\n').encode()+request.post_data_buffer)
    return [(part.get_param('name', header='content-disposition'), part.get_payload(decode=True)) for part in message.iter_parts()]

def handle(route):
    request = route.request
    path = request.url.split('/api/v1/',1)[-1].split('?')[0]
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers); return
    body = {}
    if path == 'auth/me':
        body = {'id':7,'role':'USER','status':'ACTIVE','plan_code':'STANDARD','email':'test@example.test','display_name':'시험','group_id':None}
    elif path == 'web-push/configuration': body = {'enabled':False}
    elif path == 'claims/insurers':
        body = {'items':[{'id':'35','name':'카디프(BNP)생명','kind':'LIFE','fax_mode':'REAL',
                         'fax_enabled':True,'use_virtual_fax':False,'fax_numbers':['021234567'],
                         'logo':next(r.logo.model_dump(mode="json") for r in seed_records() if r.id == 'life-cardif') }]}
    elif path == 'claims/pdf':
        parts = multipart(request)
        claim = payload(**json.loads(next(value for key,value in parts if key == 'payload')))
        assert claim.attachment_rotations == [[90],[90,90]]
        data, pages = generate('35', claim, [value for key,value in parts if key == 'files'])
        generated.append(data)
        assert pages == 17
        document = PdfReader(io.BytesIO(data))
        assert document.pages[-12].rotation == 90 and document.pages[-11].rotation == 90
        (OUT/'rotated-result.pdf').write_bytes(data)
        route.fulfill(content_type='application/pdf', body=data, headers={**headers,
            'X-Claim-Receipt':'synthetic', 'X-Claim-Pages':str(pages),'X-Claim-Fax-Cost':str(fax_cost(pages)),'X-Claim-Fax-Mode':'REAL'})
        return
    elif path == 'claims/requests' and request.method == 'POST':
        data = json.loads(next(value for key,value in multipart(request) if key == 'payload'))
        assert data['save_mode'] == 'FAX' and data['expected_fax_mode'] == 'REAL' and data['expected_fax_cost'] == 11
        assert data['claim']['attachment_rotations'] == [[90],[90,90]]
        sent.append(data)
        body = {'id':99,'save_mode':'FAX','fax_history':[{'status':'PENDING'}],'deliveries':[]}
    elif path == 'claims/share-files':
        data = next(value for key,value in multipart(request) if key == 'file')
        body = prepare_share_files(data, '시험_청구서.pdf')
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=headers)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='chrome')
    context = browser.new_context(viewport={'width':1440,'height':1000}, has_touch=True)
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE+'/claims/new')
    page.get_by_role('checkbox', name='카디프(BNP)생명').check()
    page.get_by_role('button', name='다음', exact=True).click()
    for key,value in {'insured_name':'시험고객','insured_id':'900101-1000000','insured_phone':'010-1234-5678'}.items():
        page.locator(f'[name={key}]').fill(value)
    signature = page.get_by_role('img', name='피보험자 서명 입력 영역', exact=True)
    signature.scroll_into_view_if_needed(); box = signature.bounding_box()
    page.mouse.move(box['x']+20,box['y']+20); page.mouse.down()
    page.mouse.move(box['x']+120,box['y']+60,steps=10); page.mouse.up()
    page.get_by_role('button', name='다음', exact=True).click()
    for key,value in {'accident_date':'2026-01-01','accident_description':'시험 사고','bank_name':'시험은행','account_number':'123456','account_holder':'시험고객'}.items():
        page.locator(f'[name={key}]').fill(value)
    page.locator('input[type=file]').set_input_files([
        {'name':'landscape.png','mimeType':'image/png','buffer':img.getvalue()},
        {'name':'pages.pdf','mimeType':'application/pdf','buffer':pdf.getvalue()}])
    expect(page.get_by_role('img', name='landscape.png 첨부 미리보기')).to_be_visible()
    page.get_by_role('button', name='landscape.png 90도 회전').click()
    page.get_by_role('button', name='pages.pdf 1쪽 90도 회전').click()
    page.get_by_role('button', name='다음 쪽', exact=True).click()
    page.get_by_role('button', name='pages.pdf 2쪽 90도 회전').click()
    page.screenshot(path=str(OUT/'attachments-desktop.png'), full_page=False, animations='disabled')
    page.get_by_role('checkbox').check()
    page.get_by_role('button', name='PDF 생성', exact=True).click()
    expect(page.get_by_text('생성된 PDF 1건',exact=True)).to_be_visible(timeout=30000)
    expect(page.get_by_text('17장 · 11꼬막',exact=True)).to_be_visible()
    expect(page.get_by_role('img', name='카디프(BNP)생명 청구서 1쪽 미리보기')).to_be_visible()
    help_button = page.get_by_role('button',name='모바일 팩스 무료 발송 안내')
    help_button.hover()
    expect(page.get_by_role('tooltip')).to_contain_text('다운로드 혹은 공유하기')
    expect(page.get_by_role('tooltip')).to_be_visible()
    page.mouse.move(0,0)
    page.get_by_role('button',name='팩스 발송',exact=True).click()
    expect(page.get_by_role('dialog')).to_contain_text('합계 11꼬막')
    expect(page.get_by_role('dialog')).to_contain_text('021234567')
    page.screenshot(path=str(OUT/'confirmation-desktop.png'),full_page=False, animations='disabled')
    page.get_by_role('button',name='취소',exact=True).click()
    page.set_viewport_size({'width':390,'height':844})
    help_button.tap()
    expect(page.get_by_role('tooltip')).to_contain_text('무료로 발송')
    expect(page.get_by_role('tooltip')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(OUT/'pricing-mobile.png'),full_page=False, animations='disabled')
    page.get_by_role('button',name='팩스 발송',exact=True).click()
    page.get_by_role('button',name='11꼬막 결제하고 발송',exact=True).click()
    expect(page.get_by_text('청구 요청 99번이 저장되었습니다.',exact=False)).to_be_visible()
    assert len(sent) == 1 and len(generated) == 1 and not errors, errors
    browser.close()
print('PASS: images, per-page PDF rotation, tariff, real-send confirmation, desktop/mobile help; API fully mocked')
