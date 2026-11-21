"""Mock API checks: no real database, AI or map requests. Vite on port 3339."""
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3339'
OUT = Path('/tmp/bojogae-application-ui')
OUT.mkdir(exist_ok=True)
writes, opened, errors = [], [], []
multiple = False
LOCATION = {'lat': 37.5, 'lng': 127., 'address': '서울 테스트 주소', 'accuracy': 'EXACT'}
CUSTOMER = {'id': 1, 'name': '테스트 고객', 'alias': '', 'phone': '01012345678', 'location': LOCATION,
            'stage': 'CONSULTING', 'archived': False, 'do_not_contact': False, 'groups': [], 'tags': [],
            'contracts': {'items': [], 'total': 0}, 'tasks': {'items': [], 'total': 0}, 'consultations': [],
            'premium_summary': {'monthly_known': 0, 'unknown_count': 0}}
DRAFT = {'origin': 'NEW', 'progress': 'APPLIED', 'maintenance': 'UNKNOWN', 'insurer': '시험보험',
         'product': '시험건강보험', 'premium': 23000, 'payment_cycle': 'MONTHLY', 'information_source': '보조개 제안서 #42',
         'parties': [{'role': 'HOLDER', 'customer_id': 1, 'name': '테스트 고객', 'phone': '01012345678', 'details_confirmed': True},
                     {'role': 'INSURED', 'name': '테스트 고객', 'same_as_holder': True}]}
REPORT = {'id': 42, 'title': '테스트 완료 제안서', 'status': 'COMPLETED', 'created_at': '2026-11-21T10:00:00Z',
          'prompt_title': '보험제안서', 'output_filename': 'test.html', 'output_bytes': 100, 'point_status': 'CHARGED'}

def handle(route):
    r = route.request
    path = urlparse(r.url).path.split('/api/v1/')[-1]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
               'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    if r.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers); return
    body = {}
    if path == 'auth/me': body = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'display_name': '화면 테스트', 'email': 'test@example.test', 'group_id': None}
    elif path == 'web-push/configuration': body = {'enabled': False}
    elif path == 'points/me': body = {'free_points': 0, 'paid_points': 0, 'total_points': 0}
    elif path == 'proposals/prompt-options': body = []
    elif path == 'proposals': body = {'items': [REPORT], 'total': 1, 'page': 1, 'total_pages': 1}
    elif path == 'proposals/42': opened.append(path); body = REPORT
    elif path == 'proposals/42/output/open':
        opened.append(path); route.fulfill(content_type='text/html', body='<html><body>테스트 문서</body></html>', headers=headers); return
    elif path.endswith('/from-proposal/42/preview'): body = {'drafts': [DRAFT, {**DRAFT, 'product': '다른건강보험'}] if multiple else [DRAFT]}
    elif path == 'crm/contracts/duplicates': body = {'items': []}
    elif path == 'crm/contracts/reminder-preview': body = {}
    elif path == 'crm/contracts' and r.method == 'POST': writes.append(r.post_data_json); body = {'id': 9, **r.post_data_json}
    elif path == 'crm/configuration': body = {'maps': {'enabled': True, 'place_search_enabled': True, 'key_id': 'test'}}
    elif path == 'crm/maps/search': body = {'items': [LOCATION]}
    elif path == 'crm/customers/1': body = CUSTOMER
    elif path == 'crm/nearby-customers': body = {'items': [{**CUSTOMER, 'distance_km': .5, 'search_location': LOCATION}], 'total': 1, 'page': 1, 'page_size': 50}
    elif path == 'crm/customers': body = {'items': [CUSTOMER], 'total': 1, 'page': 1, 'page_size': 50}
    elif path == 'crm/customer-groups': body = {'items': []}
    route.fulfill(content_type='application/json', body=json.dumps(body), headers=headers)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='chrome')
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.route('**/api/v1/**', handle)
    context.add_init_script("localStorage.setItem('bojogae:report-help:v1:7','true')")
    context.add_init_script(r"""
      class LatLng { constructor(lat,lng){this._lat=lat;this._lng=lng;}lat(){return this._lat;}lng(){return this._lng;} }
      class TestMap { constructor(el){this.el=el;this.handlers={};el.style.background='#edf3ef';}setSize(){}setCenter(){}setZoom(){}fitBounds(){} }
      class Marker { constructor(o){if(o.icon?.content){this.el=o.icon.content;o.map.el.append(this.el);} }setMap(m){if(!m)this.el?.remove();} }
      window.naver={maps:{Map:TestMap,Marker,LatLng,Point:class{},Size:class{},Circle:class{setMap(){}},LatLngBounds:class{extend(){}},Event:{addListener(o,e,cb){o.handlers[e]=cb;return {o,e};},removeListener(l){delete l.o.handlers[l.e];},clearInstanceListeners(o){o.handlers={};}}}};
    """)
    page = context.new_page()
    page.set_default_timeout(10000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/proposals')
    page.get_by_text('테스트 완료 제안서', exact=True).click()
    assert not opened, opened
    page.get_by_role('button', name='청약', exact=True).click()
    dialog = page.get_by_role('dialog')
    expect(dialog.get_by_text('✨ AI 청약 · 내 계약 등록', exact=True)).to_be_visible()
    expect(dialog.get_by_role('textbox', name='보험회사', exact=True)).to_have_value('시험보험')
    assert not writes
    page.screenshot(path=str(OUT/'application-desktop.png'), full_page=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert dialog.evaluate('el => el.scrollWidth <= el.clientWidth + 1')
    page.screenshot(path=str(OUT/'application-mobile.png'), full_page=True)
    dialog.get_by_role('button', name='등록', exact=True).click()
    expect(page.get_by_text('내 계약에 등록했습니다. 계약 정보를 확인할 수 있습니다.')).to_be_visible()
    assert len(writes) == 1 and writes[0]['origin'] == 'NEW' and writes[0]['progress'] == 'APPLIED'
    page.get_by_role('button', name='닫기', exact=True).click()
    multiple = True
    page.get_by_role('button', name='청약', exact=True).click()
    expect(page.get_by_text('등록할 보험 상품을 선택해 주세요')).to_be_visible()
    page.get_by_role('dialog').get_by_role('button').filter(has_text='다른건강보험').click()
    expect(page.get_by_role('textbox', name='상품명', exact=True)).to_have_value('다른건강보험')
    page.get_by_role('button', name='취소', exact=True).click()
    assert len(writes) == 1
    page.get_by_role('button', name='열기', exact=True).click()
    page.wait_for_timeout(300)
    assert opened
    page.goto(BASE + '/crm/customers/1')
    page.locator('.crm-customer-detail-workspace .customer-ref-header').wait_for()
    page.screenshot(path=str(OUT/'detail-mobile.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.goto(BASE + '/crm/customers')
    page.get_by_role('tab', name='주변 고객 지도', exact=True).click()
    expect(page.get_by_label('태그', exact=True)).not_to_be_visible()
    page.get_by_role('button', name='상세필터 ▾', exact=True).click()
    expect(page.get_by_label('태그', exact=True)).to_be_visible()
    assert page.get_by_text('보험사 (정확한 명칭)', exact=True).count() == 0
    assert page.get_by_text('주변 고객 지도 & 방문 동선', exact=True).count() == 0
    page.get_by_role('button', name='상세필터 ▴', exact=True).click()
    page.get_by_label('검색 기준 주소·장소', exact=True).fill('테스트')
    page.get_by_role('button', name='위치 검색', exact=True).click()
    page.locator('.customer-map-candidates').get_by_role('button', name='서울 테스트 주소', exact=True).click()
    page.get_by_role('button', name='주변 고객 찾기', exact=True).click()
    page.get_by_role('tab', name='주변 고객 목록 (1)', exact=True).click()
    expect(page.locator('.customer-map-card')).to_have_count(1)
    expect(page.locator('.customer-map-canvas-panel')).not_to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.screenshot(path=str(OUT/'map-list-mobile.png'), full_page=True)
    page.get_by_role('tab', name='지도 보기', exact=True).click()
    page.locator('.crm-map-pin--customer').click()
    expect(page.locator('.customer-map-floating-card')).to_be_visible()
    expect(page.locator('.customer-map-floating-card').get_by_role('link', name='전화', exact=True)).to_have_attribute('href', 'tel:01012345678')
    page.screenshot(path=str(OUT/'map-mobile.png'), full_page=True)
    page.set_viewport_size({'width': 320, 'height': 700})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.set_viewport_size({'width': 1440, 'height': 1000})
    expect(page.locator('.customer-map-canvas-panel')).to_be_visible()
    expect(page.locator('.customer-map-results')).to_be_visible()
    page.screenshot(path=str(OUT/'map-desktop.png'), full_page=True)
    assert not errors, errors
    print('PASS: row/open behavior, draft review/save, detail theme, mobile filters/panes and overflow; mock APIs only')
    browser.close()
