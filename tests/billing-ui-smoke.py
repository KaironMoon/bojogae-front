"""No live backend/PG: all API calls are intercepted with synthetic fixtures.
Run with bojogae-backend/.venv/bin/python from the workspace after Vite on 3307.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:3307'
PRODUCTS={'BASIC':{'name':'베이직 월 구독','amount':19000,'cockles':300},'STANDARD':{'name':'스탠다드 월 구독','amount':29000,'cockles':500},'PRO':{'name':'프로 월 구독','amount':49000,'cockles':1000},'TOPUP':{'name':'꼬막 추가 충전 150개','amount':9900,'cockles':150}}
USER={'id':7,'role':'USER','status':'ACTIVE','plan_code':'STANDARD','email':'test@example.test','display_name':'화면 테스트','group_id':None}
DATA={'enabled':True,'subscription':{'id':'synthetic-sub','plan_code':'STANDARD','status':'ACTIVE','period_end':'2099-11-02T03:00:00Z','cancel_at_period_end':False,'next_plan_code':None},'orders':[{'id':'synthetic-payment','product_code':'TOPUP','order_name':'꼬막 추가 충전 150개','amount':9900,'cockles':150,'status':'PAID','paid_at':'2026-10-02T03:00:00Z','refunded_amount':0}]}
posts=[]
errors=[]
config_overrides={}

def handle(route):
    request=route.request;path=request.url.split('/api/v1/',1)[-1].split('?')[0]
    headers={'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'content-type'}
    body={}
    if request.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
    if path=='auth/me':body=USER
    elif path=='users/me/profile':body={**USER,'name':'테스트','nickname':'테스트','phone':'01012345678','affiliation':'테스트','group_name':None}
    elif path=='points/me':body={'free_points':500,'paid_points':100,'total_points':600,'expiring_points':0}
    elif path=='web-push/configuration':body={'enabled':False,'vapid_public_key':''}
    elif path=='payments/config':body={'enabled':True,'eligible':True,'products':PRODUCTS,'storeId':'synthetic-store','paymentChannel':'synthetic-general','billingChannel':'synthetic-billing','policyVersion':'2026-10-03','testMode':True,**config_overrides}
    elif path=='payments/me':body=DATA
    elif path=='payments/subscriptions/upgrade-quote':body={'paymentId':'bjg-t-synthetic-upgrade','amount':5000,'cockles':100,'expiresAt':DATA['subscription']['period_end'],'quoteExpiresAt':'2099-11-01T00:00:00Z','nextAmount':49000}
    elif path=='payments/orders/synthetic-payment/refund-preview':body={'amount':6600,'cockles':100}
    elif request.method=='POST':
        posts.append((path,request.post_data_json));body={'status':'PAID'}
    route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers=headers)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1280,'height':1000})
    context.route('**/api/v1/**',handle)
    page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/profile');panel=page.locator('#plan');panel.get_by_text('구독·꼬막 충전',exact=True).wait_for()
    assert panel.get_by_role('textbox').count()==0
    panel.get_by_role('button',name='9,900원 · 150꼬막 충전').click()
    dialog=page.get_by_role('dialog')
    assert dialog.get_by_role('button',name='9,900원 결제',exact=True).is_disabled()
    dialog.get_by_role('checkbox').check()
    assert dialog.get_by_role('button',name='9,900원 결제',exact=True).is_enabled()
    for label in ('결제자 이름','휴대폰 번호','이메일'):
        assert dialog.get_by_label(label,exact=False).is_visible()
    dialog.get_by_role('button',name='닫기',exact=True).click()
    panel.get_by_role('button',name='요금제 변경',exact=True).click()
    dialog=page.get_by_role('dialog')
    assert dialog.get_by_role('textbox').count()==0
    assert dialog.get_by_role('button',name='다음 결제부터 변경',exact=True).is_disabled()
    dialog.get_by_role('checkbox').check()
    dialog.get_by_role('button',name='다음 결제부터 변경',exact=True).click()
    page.get_by_role('dialog').wait_for(state='hidden')
    assert any(path=='payments/subscriptions/change' and body['accepted'] for path,body in posts)
    page.on('dialog',lambda d:d.accept())
    assert panel.get_by_role('button',name='미사용분 환불',exact=True).count()==0
    panel.get_by_role('link',name='결제내역 보기',exact=True).click()
    page.get_by_role('table',name='결제내역 목록').wait_for()
    page.get_by_role('button',name='미사용분 환불',exact=True).click()
    page.wait_for_timeout(300)
    assert any(path.endswith('/refund') and body['expected_amount']==6600 for path,body in posts)
    page.get_by_role('link',name='구독·충전으로',exact=True).click()
    panel=page.locator('#plan')
    assert page.get_by_role('button',name='회원 탈퇴',exact=True).is_visible()
    assert page.locator('img[src="/images/kkomak.svg"]').count()>=2
    out=Path('/tmp/bojogae-billing-ui');out.mkdir(exist_ok=True)
    page.screenshot(path=str(out/'desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Mobile horizontal overflow'
    page.screenshot(path=str(out/'mobile.png'),full_page=True)
    panel.get_by_role('button',name='9,900원 · 150꼬막 충전').click()
    assert page.get_by_role('dialog').is_visible()
    page.wait_for_timeout(350)  # Finish MUI's opening transition before visual QA.
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(out/'mobile-dialog.png'))
    page.get_by_role('dialog').get_by_role('button',name='닫기',exact=True).click()
    DATA['subscription'].update(status='CANCELING',cancel_at_period_end=True)
    page.reload()
    page.locator('#plan').get_by_role('button',name='요금제 변경',exact=True).click()
    dialog=page.get_by_role('dialog')
    dialog.get_by_text('자동 갱신 해지를 철회하고 선택한 요금제로 다음 회차부터 자동 결제를 재개합니다.',exact=True).wait_for()
    dialog.get_by_role('combobox').click()
    page.get_by_role('option').filter(has_text='프로 월 구독').click()
    dialog.get_by_text('지금 결제할 차액: 5,000원',exact=True).wait_for()
    assert dialog.get_by_role('button',name='5,000원 결제·즉시 변경',exact=True).is_disabled()
    dialog.get_by_role('checkbox').check()
    dialog.get_by_role('button',name='5,000원 결제·즉시 변경',exact=True).click()
    page.get_by_role('dialog').wait_for(state='hidden')
    assert any(path=='payments/subscriptions/upgrade' and body['payment_id']=='bjg-t-synthetic-upgrade' for path,body in posts)
    DATA['subscription'].update(status='CANCELING',plan_code='BASIC',period_end=None,can_retry_first_payment=True)
    page.reload()
    panel=page.locator('#plan')
    panel.get_by_text('첫 결제 승인 후 이용기간이 시작됩니다.',exact=True).wait_for()
    panel.get_by_role('button',name='요금제 선택·재결제',exact=True).click()
    dialog=page.get_by_role('dialog')
    assert dialog.get_by_role('textbox').count()==0
    dialog.get_by_role('combobox').click()
    page.get_by_role('option').filter(has_text='프로 월 구독').click()
    assert dialog.get_by_role('button',name='49,000원 재결제',exact=True).is_disabled()
    dialog.get_by_role('checkbox').check()
    dialog.get_by_role('button',name='49,000원 재결제',exact=True).click()
    page.get_by_role('dialog').wait_for(state='hidden')
    assert any(path=='payments/subscriptions/retry' and body['plan_code']=='PRO' and body['accepted'] and len(body['idempotency_key'])>=16 for path,body in posts)
    for role,group_id,reason,message in [
        ('ADMIN',None,'ADMIN_ACCOUNT','관리자 계정은 개인 정기결제 대상이 아닙니다.'),
        ('USER',3,'GROUP_ACCOUNT','그룹 계정은 그룹 관리에서 꼬막을 관리합니다.'),
    ]:
        USER.update(role=role,group_id=group_id)
        config_overrides.update(eligible=False,ineligibleReason=reason)
        page.reload()
        page.locator('#plan').get_by_text('구독·꼬막 충전',exact=True).wait_for()
        assert page.locator('#plan').get_by_text(message,exact=False).is_visible()
        assert page.locator('#plan').get_by_role('button',name='카드 등록·첫 구독 결제').count()==0
    USER.update(role='USER',group_id=None)
    config_overrides.update(enabled=False,requestedEnabled=True)
    page.reload()
    page.get_by_text('결제 연동 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.',exact=True).wait_for()
    assert not errors, errors
    browser.close()
print('결제 동의·환불·아이콘·탈퇴·390px 및 관리자/그룹/설정누락 안내 확인 통과 (모든 API 모의 응답)')
