"""KG UI smoke test; intercept all APIs and block every external request."""
import json
import os
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

BASE=os.environ.get('UI_BASE','http://127.0.0.1:33907')
USER=dict(id=7,role='USER',status='ACTIVE',plan_code='FREE',email='test@example.test',display_name='테스트',group_id=None)
PRODUCTS={code:dict(name=name+' 월 구독',amount=amount,cockles=count) for code,name,amount,count in
          [('BASIC','베이직',19000,300),('STANDARD','스탠다드',29000,500),('PRO','프로',49000,1000)]}

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel=os.environ.get('PLAYWRIGHT_CHANNEL'))
    for width in (1280,390):
        context=browser.new_context(viewport={'width':width,'height':950})
        posts=[]
        errors=[]
        cards=[dict(id='card-kg',name='테스트 카드',number='**** 1234',alias='생활비',selected=False,status='ACTIVE',
                    can_select=True,can_delete=True,provider='MOBILPAY',deletion_scope='LOCAL'),
               dict(id='card-old',name='이전 카드',number=None,alias='이전',selected=False,status='ACTIVE',
                    can_select=False,can_delete=True,provider='PORTONE',deletion_scope='PG')]

        def route(request_route):
            request=request_route.request
            url=request.url
            if '/api/v1/' not in url:
                if url.startswith(BASE+'/'):
                    request_route.continue_()
                else:
                    request_route.abort()
                return
            path=urlsplit(url).path.split('/api/v1/',1)[1]
            headers={'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true',
                     'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'content-type'}
            if request.method=='OPTIONS':
                request_route.fulfill(status=204,headers=headers)
                return
            if request.method in ('POST','DELETE'):
                posts.append(path)
            if path=='payments/mobilpay/launch':
                request_route.fulfill(status=200,content_type='text/html; charset=utf-8',body='<meta charset="utf-8"><h1>카드 인증 테스트</h1>')
                return
            body={}
            if path=='auth/me':
                body=USER
            elif path=='users/me/profile':
                body={**USER,'name':'테스트','phone':'01012345678','nickname':'테스트'}
            elif path=='points/me':
                body=dict(free_points=0,paid_points=0,total_points=0,expiring_points=0)
            elif path=='payments/config':
                body=dict(provider='MOBILPAY',enabled=True,eligible=True,products=PRODUCTS,policyVersion='2026-10-03',billingTestMode=True,cardDeletionScope='LOCAL')
            elif path=='payments/methods':
                body=dict(cards=cards,can_register=True,verification=None,change_status=None)
            elif path=='payments/me':
                body=dict(enabled=True,subscription=None,orders=[])
            elif path=='payments/mobilpay/registrations/issue-0001/complete':
                body=dict(status='REGISTERED',method_id='card-kg')
            elif path=='payments/mobilpay/registrations/issue-sub/complete':
                body=dict(status='PAID',paymentId='order-0001')
            elif path=='payments/methods/card-kg' and request.method=='DELETE':
                cards[:]=[card for card in cards if card['id']!='card-kg']
                body=dict(status='DELETED',scope='LOCAL',remoteRevoked=False)
            elif path=='payments/methods/prepare':
                body=dict(provider='MOBILPAY',issueId='issue-0002',launchUrl=BASE+'/api/v1/payments/mobilpay/launch?token=synthetic')
            request_route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers=headers)

        context.route('**/*',route)
        page=context.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(BASE+'/payment-methods?cardRegistrationReturn=1&mobilpayIssue=issue-0001')
        page.get_by_text('1,000원 승인과 전액 취소를 확인하고 카드를 등록했습니다.',exact=False).wait_for()
        assert posts==['payments/mobilpay/registrations/issue-0001/complete']
        assert 'mobilpayIssue' not in page.url
        old=page.get_by_text('이전 결제사에 등록한 카드입니다.',exact=False)
        assert old.is_visible()
        page.get_by_role('button',name='카드 삭제',exact=True).first.click()
        dialog=page.get_by_role('dialog')
        assert '보조개에 저장된 카드 결제정보를 삭제' in dialog.inner_text()
        assert '목록과 PG에서 삭제' not in dialog.inner_text()
        dialog.get_by_role('button',name='카드 삭제',exact=True).click()
        page.get_by_text('카드가 삭제되었습니다.',exact=True).wait_for()
        page.get_by_role('button',name='카드 등록',exact=True).click()
        dialog=page.get_by_role('dialog')
        dialog.get_by_label('카드 별칭',exact=False).fill('새 카드')
        dialog.get_by_role('checkbox').check()
        dialog.get_by_role('button',name='카드 등록',exact=True).click()
        page.get_by_role('heading',name='카드 인증 테스트').wait_for()
        assert posts.count('payments/methods/prepare')==1
        page.goto(BASE+'/profile?billingReturn=1&mobilpayIssue=issue-sub')
        page.get_by_text('월간 구독권',exact=True).wait_for()
        page.wait_for_function("!window.location.search.includes('mobilpayIssue')")
        assert posts.count('payments/mobilpay/registrations/issue-sub/complete')==1
        assert 'payments/subscriptions/activate' not in posts
        assert not errors,errors
        context.close()
    browser.close()
print('MOBILPAY desktop/mobile return, local deletion, legacy card display and checkout handoff passed; external requests blocked.')
