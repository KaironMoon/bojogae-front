"""Exercise the shared customer form with mocked import APIs; no customer persistence."""
import json
import os

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get('CRM_IMPORT_UI_BASE', 'http://127.0.0.1:3397')
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD',
        'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
PARSED = {
    'format': 'TSV', 'text': '성함\tTEL\n시험고객\t01012345678\n다른고객\t01022223333\n',
    'headers': ['성함', 'TEL'], 'mapping': {'성함': 'name', 'TEL': 'phone'},
    'confidence': {'성함': .99, 'TEL': .7}, 'header_row': 1,
    'header_options': [{'value': 1, 'label': '2행: 성함 / TEL'}],
    'customer_lines': 3, 'data_start': 4, 'data_start_options': [2, 3, 4, 5], 'layout_error': '',
    'samples': [['시험고객', '01012345678']], 'warning': '',
    'transform_source': 'def transform(row):\n    return {"phone": digits(row[1])}',
    'transform_samples': [{'index': 0, 'input': ['시험고객', '01012345678'], 'output': {'phone': '01012345678'}, 'errors': []}],
}
ROWS = [
    {'index': i, 'customer': {'name': name, 'phone': phone}, 'errors': [],
     'original': {}, 'raw': {'성함': name, 'TEL': phone}}
    for i, (name, phone) in enumerate([('시험고객', '01012345678'), ('다른고객', '01022223333')])
]
errors, uploads, previews, commits, registrations = [], [], [], [], []
autofill_requests, autofill_feedback = [], []


def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
               'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    body = {}
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'crm/customers' and request.method == 'POST':
        registrations.append(request.post_data_json)
        body = {'id': 9}
    elif path == 'crm/customers':
        body = {'items': [], 'total': 0, 'page': 1, 'page_size': 20}
    elif path == 'crm/customers/duplicates':
        body = {'items': []}
    elif path == 'crm/customers/ai-extract':
        autofill_requests.append(request.post_data)
        fields = {'name': '자동 채움 고객', 'tags': ['상담']} if len(autofill_requests) == 1 else {'unknown_field': '값'}
        body = {'request_id': 'be41e2db-9d44-48c1-87bc-326e1d596571', 'fields': fields, 'message': '추출 완료'}
    elif path == 'crm/customers/ai-extract/feedback':
        autofill_feedback.append(request.post_data)
    elif path == 'crm/customer-groups':
        body = {'items': []}
    elif path == 'crm/imports/parse-file':
        uploads.append(request.post_data)
        body = PARSED
    elif path == 'crm/imports':
        payload = request.post_data_json
        previews.append(payload)
        rows = ROWS
        if payload['mapping']['TEL'] == 'memo':
            rows = [{**row, 'customer': {'name': row['customer']['name'], 'memo': row['raw']['TEL']}}
                    for row in ROWS]
        body = {'id': len(previews), 'rows': rows, 'status': 'PREVIEW'}
    elif path.endswith('/commit'):
        commits.append(request.post_data_json)
        body = {'count': len(commits[-1]['indices'])}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.set_default_timeout(7000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/crm/customers')
    page.get_by_role('button', name='고객 등록', exact=True).click()
    dialog = page.get_by_role('dialog')
    dialog.get_by_label('고객명').fill('수동 입력 중')
    upload_area = dialog.get_by_role('button', name='엑셀 · CSV 가져오기', exact=True)
    with page.expect_file_chooser() as chooser:
        upload_area.click()
    chooser.value.set_files([])
    expect(dialog.get_by_label('고객명')).to_have_value('수동 입력 중')
    upload_area.evaluate("""element => {
      const data = new DataTransfer();
      data.items.add(new File(['synthetic'], 'customers.xlsx'));
      for (let i = 0; i < 2; i++)
        element.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: data}));
    }""")
    expect(dialog.get_by_label('고객명')).to_have_value('시험고객')
    expect(dialog.get_by_text('엑셀 3행을 고객 한 명으로 읽었습니다.', exact=True)).to_be_visible()
    expect(dialog.get_by_label('제목 행')).to_have_count(0)
    expect(dialog.get_by_role('button', name='이전', exact=True)).to_be_disabled()
    assert len(uploads) == 1
    assert previews[0]['mapping'] == PARSED['mapping'] and previews[0]['mapping_confirmed']
    assert previews[0]['transform_source'] == PARSED['transform_source']
    assert not commits

    dialog.get_by_role('button', name='항목 연결 확인·수정', exact=True).click()
    expect(dialog.get_by_label('제목 행')).to_be_visible()
    expect(dialog.get_by_label('고객당 행 수')).to_contain_text('3행')
    expect(dialog.get_by_label('첫 고객 행')).to_contain_text('5행')
    dialog.get_by_text('함수와 변환 샘플 확인', exact=True).click()
    expect(dialog.get_by_text('함수 결과 · 연락처 01012345678', exact=True)).to_be_visible()
    dialog.get_by_role('checkbox', name='AI가 만든 값 처리 함수 적용', exact=True).uncheck()
    dialog.get_by_label('TEL → 저장 항목 · 확인 필요', exact=True).click()
    page.get_by_role('option', name='메모', exact=True).click()
    dialog.get_by_role('button', name='적용하고 고객 다시 불러오기', exact=True).click()
    expect(dialog.get_by_label('고객 메모')).to_have_value('01012345678')
    assert previews[-1]['mapping']['TEL'] == 'memo'
    assert 'transform_source' not in previews[-1]
    assert not commits

    dialog.get_by_label('고객명').fill('첫 고객 수정')
    dialog.get_by_role('checkbox', name='이 고객 등록', exact=True).check()
    dialog.get_by_role('button', name='다음', exact=True).click()
    expect(dialog.get_by_label('고객명')).to_have_value('다른고객')
    expect(dialog.get_by_role('button', name='다음', exact=True)).to_be_disabled()
    dialog.get_by_label('연락처').fill('01055556666')
    dialog.get_by_role('button', name='항목 연결 확인·수정', exact=True).click()
    dialog.get_by_role('button', name='고객 검토로 돌아가기', exact=True).click()
    expect(dialog.get_by_label('연락처')).to_have_value('010-5555-6666')
    dialog.get_by_role('button', name='이전', exact=True).click()
    expect(dialog.get_by_label('고객명')).to_have_value('첫 고객 수정')
    expect(dialog.get_by_role('checkbox', name='이 고객 등록', exact=True)).to_be_checked()
    dialog.get_by_label('연락처').fill('01077778888')

    page.set_viewport_size({'width': 390, 'height': 844})
    assert dialog.evaluate('(d) => d.scrollWidth <= d.clientWidth')
    assert not commits
    dialog.get_by_role('button', name='선택한 고객 일괄 등록', exact=True).click()
    expect(dialog).to_have_count(0)
    expect(page.get_by_text('1명의 고객을 등록했습니다.', exact=True)).to_be_visible()
    expect(page).to_have_url(BASE + '/crm/customers')
    assert len(commits) == 1 and commits[0]['indices'] == [0] and commits[0]['reviewed']
    assert set(commits[0]['overrides']) == {'0'}
    assert commits[0]['overrides']['0']['name'] == '첫 고객 수정'
    assert commits[0]['overrides']['0']['phone'] == '010-7777-8888'

    page.set_viewport_size({'width': 1280, 'height': 1000})
    page.get_by_role('button', name='고객 등록', exact=True).click()
    dialog.get_by_label('AI 고객정보 입력').fill('진단 테스트 입력')
    autofill = dialog.get_by_role('button', name='AI 자동 채움 실행', exact=True)
    autofill.click()
    expect(dialog.get_by_label('고객명')).to_have_value('자동 채움 고객')
    expect(dialog.get_by_label('태그 (쉼표 구분)')).to_have_value('상담')
    expect(dialog.get_by_text('추출 완료', exact=True)).to_be_visible()
    assert not autofill_feedback
    with page.expect_request('**/customers/ai-extract/feedback') as report:
        autofill.click()
    assert 'form_not_applied' in report.value.post_data and '진단 테스트 입력' in report.value.post_data
    expect(dialog.get_by_text('자동으로 입력된 고객 정보가 없습니다.', exact=True)).to_be_visible()
    dialog.get_by_label('고객명').fill('개별 등록 고객')
    dialog.get_by_label('연락처').fill('01033334444')
    dialog.get_by_role('button', name='저장', exact=True).click()
    expect(dialog).to_have_count(0)
    expect(page).to_have_url(BASE + '/crm/customers')
    assert len(registrations) == 1 and registrations[0]['name'] == '개별 등록 고객'
    assert not errors, errors
    browser.close()
    print('PASS: shared form, optional mapping, row navigation, edits and selection, mobile layout, selected batch payload')
