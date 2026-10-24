"""Synthetic API-only UI check; never connects to CRM DB or NAVER services.
Run a separate Vite server: pnpm dev --host 127.0.0.1 --port 3317 --strictPort
"""
import json
import os
import sys
from copy import deepcopy
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "bojogae-backend"))
from schemas.crm import CustomerIdentityInput, ContractUpdate
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3317'
OUT = Path('/tmp/bojogae-crm-ui')
OUT.mkdir(exist_ok=True)
LOCATION = {'address': '테스트 방문 장소', 'lat': 37.5, 'lng': 127.0, 'accuracy': 'APPROXIMATE'}
CUSTOMER = {'id': 1, 'owner_id': 9, 'version': 1, 'archived': False, 'name': '테스트 고객', 'phone': '01000000000',
    'gender': 'UNKNOWN', 'birth_raw': '69년생', 'birth_date': None, 'received_date': None, 'received_raw': '10월 01일',
    'source': '소개', 'provider': '', 'region': '서울', 'location': LOCATION, 'address_detail': '', 'visit_note': '',
    'call_preference': '평일 오후', 'visit_preference': '주말', 'premium_note': '10만원대', 'memo': '테스트 상담',
    'tags': ['상담'], 'stage': 'CONSULTING', 'do_not_contact': False, 'contract_count': 1,
    'last_contact_at': None, 'next_task': None}
CONTRACT = {'id': 2, 'version': 1, 'archived': False, 'origin': 'EXISTING', 'insurer': '테스트 보험사', 'product': '테스트 보험',
    'category': '건강', 'policy_number': '', 'parties': [{'role': 'HOLDER', 'customer_id': 1, 'name': '테스트 고객'}],
    'premium': '120000', 'premium_monthly': '10000', 'payment_period': '20년', 'payment_cycle': 'YEARLY', 'application_date': None, 'establishment_date': None,
    'coverage_start': None, 'coverage_end': None, 'payment_end': None, 'period_note': '', 'coverage_note': '',
    'progress': None, 'maintenance': 'ACTIVE', 'information_source': '증권', 'verified': True, 'verified_date': None, 'events': []}
TASK = {'id': 3, 'version': 1, 'customer_id': 1, 'customer_name': '테스트 고객', 'customer_location': LOCATION,
    'contract_id': 2, 'kind': 'VISIT', 'title': '방문 상담', 'due_date': '2026-10-24', 'due_at': None,
    'status': 'PENDING', 'location': LOCATION, 'note': '', 'is_today': True, 'is_overdue': False}
errors, writes, external = [], [], []

def collection(items):
    return {'items': items, 'total': len(items), 'page': 1, 'page_size': 50}


def handle(route):
    request = route.request
    path = urlparse(request.url).path.split('/api/v1/')[-1]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    if request.method in ('POST', 'PUT', 'DELETE'):
        writes.append((path, request.post_data_json if request.post_data else None))
    status, body = 200, {}
    if path == 'auth/me':
        body = {'id': 9, 'role': 'USER', 'status': 'ACTIVE', 'email': 'test@example.com', 'display_name': '테스트 설계사', 'group_id': None}
    elif path == 'web-push/configuration': body = {'enabled': False}
    elif path == 'crm/maps/geocode': body = {'items': [{**LOCATION, 'accuracy': 'EXACT'}]}
    elif path == 'crm/maps/navigation-link': body = {'web': 'https://map.naver.com/p/directions/test'}
    elif path == 'crm/configuration': body = {'maps': {'enabled': False, 'key_id': '', 'geocoding_enabled': False}}
    elif path == 'crm/customer-identity/normalize': body = CustomerIdentityInput.model_validate(request.post_data_json).model_dump(mode='json')
    elif path == 'crm/customers': body = collection([CUSTOMER])
    elif path == 'crm/customers/1/contract-party': body = {'customer_id': 1, 'name': CUSTOMER['name'], 'phone': CUSTOMER['phone'], 'resident_number': CustomerIdentityInput.model_validate({k: v for k, v in CUSTOMER.items() if k in CustomerIdentityInput.model_fields}).resident_number, 'details_confirmed': True}
    elif path == 'crm/customers/duplicates': body = {'items': []}
    elif path == 'crm/customers/1':
        if request.method == 'PUT': CUSTOMER.update(request.post_data_json)
        body = {**CUSTOMER, 'contracts': collection([CONTRACT]), 'consultations': [], 'tasks': collection([TASK]),
                'premium_summary': {'monthly_known': '10000', 'unknown_count': 0}}
    elif path == 'crm/contracts': body = collection([CONTRACT])
    elif path == 'crm/contracts/2':
        if request.method == 'PUT': CONTRACT.update(ContractUpdate.model_validate(request.post_data_json).model_dump(mode='json', exclude={'version'}))
        body = CONTRACT
    elif path == 'crm/tasks':
        if request.method == 'POST': body = {**TASK, **request.post_data_json, 'id': 4}
        else: body = collection([TASK])
    elif path == 'crm/tasks/3': body = {**TASK, **(request.post_data_json or {})}
    elif path == 'crm/attachments': body = collection([])
    elif path == 'crm/nearby-customers': body = {**collection([{**CUSTOMER, 'search_location': LOCATION, 'distance_km': .3, 'task_id': None}]), 'distance_type': 'STRAIGHT_LINE'}
    elif path == 'insurers': body = {'items': [{'id': 'test', 'name': '테스트 보험사'}]}
    elif path == 'crm/summary': body = {'customers': 1, 'contracts': 1, 'today': collection([TASK]), 'overdue': collection([])}
    elif path == 'crm/imports':
        body = {'id': 5, 'status': 'PREVIEW', 'rows': [{'raw': {'고객명': '가져오기 고객'},
            'customer': {**deepcopy(CUSTOMER), 'name': f'가져오기 고객{i}'}, 'errors': [], 'duplicates': [], 'original': {}, 'index': i} for i in range(5000)]}
    elif path == 'crm/imports/5/commit': body = {'count': len(request.post_data_json['indices']), 'items': []}
    elif request.method in ('POST', 'PUT'): body = {'id': 7, **(request.post_data_json or {})}
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, geolocation={'latitude': 37.5, 'longitude': 127.0}, permissions=['geolocation'])
    context.route('**/api/v1/**', handle)
    def block_external(route):
        external.append(route.request.url)
        route.abort()
    context.route('**/*naver.com/**', block_external)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_default_timeout(10000)
    page.goto(BASE + '/crm/customers')
    try:
        page.get_by_role('heading', name='내고객', exact=True).wait_for()
    except Exception:
        print('PAGE ERRORS', errors)
        print('PAGE BODY', page.locator('body').inner_text()[:2000])
        page.screenshot(path=str(OUT / 'failure.png'), full_page=True)
        raise
    nav = page.get_by_role('navigation', name='주요 메뉴')
    labels = nav.inner_text()
    assert labels.index('보험사 정보·링크') < labels.index('보고서 만들기') < labels.index('보험금 청구') < labels.index('고객관리')
    expect(nav.get_by_role('button', name='내 고객', exact=True)).to_be_visible()
    nav.get_by_role('button', name='고객관리', exact=True).click()
    expect(nav.get_by_role('button', name='내 계약', exact=True)).to_have_count(0)
    nav.get_by_role('button', name='고객관리', exact=True).click()
    nav.get_by_role('button', name='내 고객', exact=True).wait_for()
    page.get_by_role('link', name='상세', exact=True).click()
    page.get_by_role('heading', name='테스트 고객', exact=True).wait_for()
    page.get_by_text('확인된 월 환산 보험료 10,000원').wait_for()
    page.get_by_role('button', name='고객 수정', exact=True).click()
    form = page.get_by_role('dialog', name='고객정보 수정', exact=True)
    form.get_by_label('고객명', exact=False).fill('수정 고객')
    form.get_by_label('고객 별칭', exact=True).fill('테스트 고객 흥국 76 도봉')
    form.get_by_label('직업', exact=True).fill('회사원')
    form.get_by_label('생년월일', exact=True).fill('19760503')
    form.get_by_label('성별', exact=True).click()
    page.get_by_role('option', name='남성', exact=True).click()
    resident = form.get_by_label('주민번호 앞 6자리·뒤 첫 1자리', exact=True)
    expect(resident).to_have_value('760503-1')
    resident.fill('010101-8')
    form.get_by_label('생년월일', exact=True).fill('19850203')
    expect(form.get_by_text('1985년 02월 03일', exact=False)).to_be_visible()
    expect(resident).to_have_value('010101-8')
    page.screenshot(path=str(OUT / 'customer-fields.png'), full_page=True)
    form.get_by_role('button', name='저장', exact=True).click()
    form.wait_for(state='hidden')
    page.get_by_role('heading', name='수정 고객', exact=True).wait_for()
    assert CUSTOMER['alias'] == '테스트 고객 흥국 76 도봉'
    assert CUSTOMER['occupation'] == '회사원'
    assert CUSTOMER['resident_number'] == '010101-8' and CUSTOMER['resident_number_manual']
    page.get_by_text('테스트 고객 흥국 76 도봉', exact=False).wait_for()
    page.get_by_role('button', name='상담 기록 등록', exact=True).click()
    consultation = page.get_by_role('dialog', name='상담 기록', exact=True)
    assert consultation.get_by_label('관련 계약', exact=False).count() == 0
    consultation.get_by_role('button', name='취소', exact=True).click()
    page.get_by_role('tab', name='보험 계약 (1)', exact=True).click()
    page.get_by_role('link', name='계약 상세', exact=True).click()
    page.get_by_role('heading', name='테스트 보험', exact=True).wait_for()
    for label in ['보험회사', '청약일', '상품명', '월 보험료', '납입기간', '증권/설계번호']:
        page.get_by_text(label, exact=True).wait_for()
    page.screenshot(path=str(OUT / 'contract-fields.png'), full_page=True)
    page.get_by_role('button', name='정보 수정', exact=True).click()
    contract_form = page.get_by_role('dialog', name='계약정보 수정', exact=True)
    expect(contract_form.get_by_label('납입기간', exact=True)).to_have_value('20년')
    expect(contract_form.get_by_label('성함', exact=True).first).to_have_value('수정 고객')
    contract_form.get_by_label('성함', exact=True).first.fill('계약 전용 이름')
    contract_form.get_by_label('주민번호 앞 7자리', exact=True).first.fill('020202-4')
    contract_form.get_by_label('연락처', exact=True).first.fill('01077778888')
    contract_form.get_by_role('button', name='관계자 추가', exact=True).click()
    contract_form.get_by_label('계약자와 동일', exact=True).check()
    expect(contract_form.get_by_label('성함', exact=True).nth(1)).to_have_value('계약 전용 이름')
    expect(contract_form.get_by_label('성함', exact=True).nth(1)).to_be_disabled()
    contract_form.get_by_label('성함', exact=True).first.fill('계약 전용 수정')
    expect(contract_form.get_by_label('성함', exact=True).nth(1)).to_have_value('계약 전용 수정')
    page.screenshot(path=str(OUT / 'contract-parties.png'), full_page=True)
    contract_form.get_by_role('button', name='저장', exact=True).click()
    contract_form.wait_for(state='hidden')
    assert CONTRACT['parties'][1]['name'] == '계약 전용 수정'
    assert CONTRACT['parties'][1]['resident_number'] == '020202-4'
    assert CONTRACT['parties'][1]['phone'] == '01077778888'
    assert CUSTOMER['name'] == '수정 고객' and CUSTOMER['resident_number'] == '010101-8'
    page.get_by_role('button', name='정보 수정', exact=True).click()
    contract_form = page.get_by_role('dialog', name='계약정보 수정', exact=True)
    contract_form.get_by_label('계약자와 동일', exact=True).uncheck()
    contract_form.get_by_label('피보험자 고객 선택', exact=True).click()
    page.get_by_role('option', name='직접 입력 / 미연결', exact=True).click()
    contract_form.get_by_label('성함', exact=True).nth(1).fill('별도 피보험자')
    contract_form.get_by_label('주민번호 앞 7자리', exact=True).nth(1).fill('030303-3')
    contract_form.get_by_label('연락처', exact=True).nth(1).fill('01055556666')
    contract_form.get_by_role('button', name='저장', exact=True).click()
    contract_form.wait_for(state='hidden')
    assert CONTRACT['parties'][1]['name'] == '별도 피보험자'
    assert CONTRACT['parties'][1]['customer_id'] is None
    assert CONTRACT['parties'][0]['name'] == '계약 전용 수정'
    page.get_by_role('button', name='상태 변경', exact=True).click()
    page.get_by_role('dialog', name='계약 상태 변경').get_by_label('변경 사유', exact=False).fill('확인')
    page.get_by_role('dialog', name='계약 상태 변경').get_by_role('button', name='취소').click()
    page.get_by_role('button', name='후속 업무 등록', exact=True).click()
    task_form = page.get_by_role('dialog', name='업무·방문 일정 등록')
    assert task_form.get_by_label('관련 계약', exact=False).count() == 0
    task_form.get_by_label('업무 제목', exact=False).fill('서류 요청')
    task_form.get_by_role('button', name='저장', exact=True).click()
    task_form.wait_for(state='hidden')
    page.get_by_role('heading', name='할 일·방문 일정', exact=True).wait_for()
    page.get_by_role('button', name='수정·처리', exact=True).click()
    page.get_by_role('dialog', name='업무·일정 수정').get_by_role('button', name='취소').click()
    page.goto(BASE + '/crm/customers')
    page.get_by_role('tab', name='주변 고객 지도', exact=True).click()
    page.get_by_role('button', name='내 위치', exact=True).click()
    page.get_by_text('기준 위치: 현재 위치', exact=False).wait_for()
    page.get_by_role('button', name='주변 고객 찾기', exact=True).click()
    page.get_by_text('대략 위치에 따른 참고 거리입니다.', exact=True).wait_for()
    page.get_by_label('방문 후보', exact=True).check()
    page.get_by_text('방문 후보 1명', exact=True).wait_for()
    page.get_by_role('button', name='길찾기', exact=True).last.click()
    directions = page.get_by_role('dialog', name='네이버 지도 길찾기')
    assert directions.get_by_role('link', name='네이버 지도에서 열기').get_attribute('href').startswith('https://map.naver.com/')
    directions.get_by_role('button', name='닫기').click()
    page.screenshot(path=str(OUT / 'nearby-desktop.png'), full_page=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(OUT / 'nearby-mobile.png'), full_page=True)
    page.goto(BASE + '/crm/customers')
    page.get_by_role('button', name='자료 가져오기', exact=True).click()
    imports = page.get_by_role('dialog', name='고객 자료 가져오기')
    imports.get_by_label('원본 내용 붙여넣기', exact=True).fill('고객명\t연락처\n가져오기 고객\t01000000000')
    imports.get_by_role('button', name='미리보기').click()
    expect(imports.get_by_text('총 5000행 · 선택 0행', exact=True)).to_be_visible()
    assert imports.get_by_role('button', name='내용 수정', exact=True).count() == 50
    imports.get_by_role('button', name='Go to page 2').click()
    imports.get_by_label('등록 가능한 행 모두 선택', exact=True).check()
    imports.get_by_label('선택한 고객 정보·중복 여부·미확인 항목을 검토했습니다', exact=True).check()
    imports.get_by_role('button', name='선택 고객 등록', exact=True).click()
    imports.get_by_text('5000명의 고객을 등록했습니다.', exact=True).wait_for()
    assert not errors, errors
    assert not external, external
    assert any(path == 'crm/customers/1' for path, _ in writes)
    assert any(path == 'crm/imports/5/commit' for path, _ in writes)
    print(json.dumps({'page_errors': errors, 'external_requests': external, 'writes': len(writes), 'screenshots': str(OUT)}, ensure_ascii=False))
    browser.close()
