"""Run Vite on 3397; synthetic requests only, no customer persistence."""
import json
import os
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CRM_IMPORT_UI_BASE', 'http://127.0.0.1:3397')
errors, previews, writes, sample_requests = [], [], [], []
USER = {'id': 7, 'role': 'USER', 'status': 'ACTIVE', 'plan_code': 'STANDARD', 'email': 'test@example.test', 'display_name': '화면 테스트', 'group_id': None}
parsed = {'format': 'TSV', 'text': '성함\tTEL\t기타\n시험고객\t01012345678\t제외\n',
          'headers': ['성함', 'TEL', '기타'], 'mapping': {'성함': 'name', 'TEL': 'phone', '기타': '__ignore__'},
          'confidence': {'성함': .99, 'TEL': .7, '기타': .3}, 'header_row': 1,
          'header_options': [{'value': 0, 'label': '1행: 고객 명단'}, {'value': 1, 'label': '2행: 성함 / TEL / 기타'}],
          'samples': [['시험고객', '01012345678', '제외']], 'warning': ''}
fallback = False


def handle(route):
    request = route.request
    path = request.url.split('/api/v1/', 1)[-1].split('?')[0]
    headers = {'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
               'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type'}
    body = {}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers)
        return
    if request.method != 'GET':
        writes.append(path)
    if path == 'auth/me':
        body = USER
    elif path == 'web-push/configuration':
        body = {'enabled': False}
    elif path == 'crm/customers':
        body = {'items': [], 'total': 0, 'page': 1, 'page_size': 20}
    elif path == 'crm/imports/parse-file':
        body = {**parsed, 'warning': '자동 인식을 완료하지 못했습니다. 제목 행과 저장 항목을 직접 선택해 주세요.' if fallback else ''}
        if any(name in (request.post_data or '') for name in ('customers.html', 'customers.png')):
            body = {**parsed, 'format': 'CSV', 'extractor': 'gpt-6-luna', 'header_options': [], 'warning': '추출한 값을 원본과 대조해 주세요.'}
    elif path == 'crm/imports/extract-html':
        body = {**parsed, 'format': 'CSV', 'extractor': 'gpt-6-luna', 'header_options': [], 'warning': '추출한 값을 원본과 대조해 주세요.'}
    elif path == 'crm/imports/mapping-sample':
        sample_requests.append(request.post_data_json)
        body = {'columns': [{'source': source, 'field': field} for source, field in request.post_data_json['mapping'].items()],
                'rows': [{'index': i, 'customer': {'name': f'시험고객{i}', 'phone': '01012345678'}, 'errors': [], 'original': {}, 'raw': {}} for i in range(10)]}
    elif path == 'crm/imports':
        previews.append(request.post_data_json)
        body = {'id': 3, 'rows': [{'index': 0, 'customer': {'name': '시험고객', 'phone': '01012345678'}, 'errors': [], 'original': {}, 'raw': {'성함': '시험고객'}}]}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(body), headers=headers)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get('PLAYWRIGHT_CHANNEL', 'chrome'))
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    context.route('**/api/v1/**', handle)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/crm/customers')
    page.get_by_role('button', name='자료 가져오기', exact=True).click()
    dialog = page.get_by_role('dialog')
    upload_area = dialog.get_by_role('button', name='고객 자료 파일 업로드', exact=True)
    def drop_files(files, twice=False):
        upload_area.evaluate("""(element, {files, twice}) => {
          const data = new DataTransfer();
          for (const file of files) data.items.add(new File([file.content || 'synthetic'], file.name, {type: file.mime || 'text/csv'}));
          element.dispatchEvent(new DragEvent('dragenter', {bubbles: true, dataTransfer: data}));
          element.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: data}));
          if (twice) element.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: data}));
        }""", {'files': files, 'twice': twice})
    drop_files([{'name': 'one.csv'}, {'name': 'two.csv'}])
    expect(dialog.get_by_text('파일은 한 번에 하나씩 올려 주세요.', exact=True)).to_be_visible()
    assert not writes
    drop_files([{'name': 'unsupported.exe'}])
    expect(dialog.get_by_text('엑셀(.xlsx), CSV, HTML 또는 이미지(PNG·JPEG·WebP)를 선택해 주세요.', exact=True)).to_be_visible()
    assert not writes
    # Two immediate drop events must result in just one upload.
    drop_files([{'name': 'customers.csv'}], twice=True)

    expect(dialog.get_by_label('성함 → 저장 항목', exact=True)).to_contain_text('고객명')
    expect(dialog.get_by_label('TEL → 저장 항목 · 확인 필요', exact=True)).to_contain_text('연락처')
    expect(dialog.get_by_label('기타 → 저장 항목 · 확인 필요', exact=True)).to_contain_text('가져오지 않음')
    expect(dialog.get_by_text('샘플: 시험고객', exact=True)).to_be_visible()
    expect(dialog.get_by_text('선택한 파일: customers.csv', exact=True)).to_be_visible()
    assert writes.count('crm/imports/parse-file') == 1
    with page.expect_file_chooser() as chooser:
        upload_area.click()
    # Closing the chooser keeps the existing mapping intact.
    chooser.value.set_files([])
    consent = dialog.get_by_role('checkbox', name='표시된 매핑 결과를 확인했으며, 이 방식으로 가져오는 데 동의합니다', exact=True)
    proceed = dialog.get_by_role('button', name='동의하고 전체 데이터 검증', exact=True)
    dialog.get_by_role('button', name='매핑 결과 10명 확인', exact=True).click()
    expect(dialog.get_by_role('table', name='매핑된 고객 데이터 샘플')).to_be_visible()
    expect(dialog.get_by_role('table').get_by_role('row')).to_have_count(11)
    expect(dialog.get_by_text('시험고객9', exact=True)).to_be_visible()
    expect(proceed).to_be_disabled()
    assert not previews
    consent.check()
    expect(proceed).to_be_enabled()
    # Changing any mapping invalidates both the sample and its consent.
    dialog.get_by_label('TEL → 저장 항목 · 확인 필요', exact=True).click()
    page.get_by_role('option', name='메모', exact=True).click()
    expect(dialog.get_by_role('table')).to_have_count(0)
    dialog.get_by_label('TEL → 저장 항목 · 확인 필요', exact=True).click()
    page.get_by_role('option', name='연락처', exact=True).click()
    dialog.get_by_role('button', name='매핑 결과 10명 확인', exact=True).click()
    expect(consent).not_to_be_checked()
    expect(proceed).to_be_disabled()
    consent.check()
    proceed.click()
    expect(dialog.get_by_text('총 1행 · 선택 0행', exact=True)).to_be_visible()
    expect(dialog.get_by_role('button', name='선택 고객 등록', exact=True)).to_be_disabled()
    assert previews[0]['mapping'] == parsed['mapping']
    assert previews[0]['mapping_confirmed'] is True
    assert len(sample_requests) == 2
    dialog.get_by_role('button', name='매핑 다시 하기', exact=True).click()
    expect(dialog.get_by_role('table')).to_have_count(0)
    fallback = True
    dialog.locator('input[type=file]').set_input_files({'name': 'retry.csv', 'mimeType': 'text/csv', 'buffer': b'synthetic'})
    expect(dialog.get_by_text('자동 인식을 완료하지 못했습니다. 제목 행과 저장 항목을 직접 선택해 주세요.', exact=True)).to_be_visible()
    dialog.get_by_role('button', name='매핑 결과 10명 확인', exact=True).click()
    expect(consent).not_to_be_checked()
    page.set_viewport_size({'width': 390, 'height': 844})
    assert dialog.evaluate('(d) => d.scrollWidth <= d.clientWidth')
    # HTML and image extraction reuse the mapping/sample/consent flow.
    for filename, mime in [('customers.html', 'text/html'), ('customers.png', 'image/png')]:
        dialog.locator('input[type=file]').set_input_files({'name': filename, 'mimeType': mime, 'buffer': b'synthetic'})
        expect(dialog.get_by_label('추출된 CSV (수정 가능)', exact=True)).to_be_visible()
        expect(dialog.get_by_label('제목 행', exact=True)).to_have_count(0)
        expect(dialog.get_by_role('table')).to_have_count(0)
        dialog.get_by_role('button', name='매핑 결과 10명 확인', exact=True).click()
        expect(consent).not_to_be_checked()
        expect(proceed).to_be_disabled()
    # Pasted arbitrary HTML gets extracted before the sample step.
    dialog.get_by_label('자료 형식', exact=True).click()
    page.get_by_role('option', name='HTML 붙여넣기', exact=True).click()
    dialog.get_by_label('원본 내용 붙여넣기', exact=True).fill('<table><tr><td>시험고객</td></tr></table>')
    dialog.get_by_role('button', name='HTML 추출 및 매핑', exact=True).click()
    expect(dialog.get_by_label('추출된 CSV (수정 가능)', exact=True)).to_be_visible()
    expect(dialog.get_by_role('table')).to_have_count(0)
    assert not errors, errors
    assert all(path in ('crm/imports/parse-file', 'crm/imports/mapping-sample', 'crm/imports/extract-html', 'crm/imports') for path in writes), writes
    browser.close()
    print('PASS: drag/drop and click upload, multi-file/type rejection, concurrent-drop guard, ten normalized samples, consent gate, mapping change and upload reset consent, confirmed full preview, final review gate, failure message, mobile layout, HTML/image upload and pasted HTML extraction; no commit request')
