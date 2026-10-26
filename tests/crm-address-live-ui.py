"""Synthetic live snapshots: no database, Redis or Naver calls.
Start a dedicated Vite on 3339 before running.
"""
import json
import re
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect

BASE='http://127.0.0.1:3339'
CUSTOMER={'id':10,'name':'실시간 고객','alias':'','phone':'01000000000','location':{'address':'테스트 주소','lat':37.501,'lng':127,'accuracy':'APPROXIMATE'},'address_resolution':{'status':'UNRESOLVED'},'tags':[],'stage':'UNCONTACTED','archived':False,'contract_count':0,'version':1}
queries=[]
errors=[]
writes=[]
def route_api(route):
    req=route.request
    path=urlparse(req.url).path
    headers={'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}
    if req.method=='OPTIONS': route.fulfill(status=204,headers=headers);return
    if req.method!='GET': writes.append(path)
    if path.endswith('/auth/me'): body={'id':9,'role':'USER','status':'ACTIVE','email':'test@example.com','display_name':'테스트','group_id':None}
    elif path.endswith('/crm/configuration'): body={'address_worker_enabled':True,'maps':{'enabled':False,'key_id':'','geocoding_enabled':False}}
    elif path.endswith('/crm/customers'):
        queries.append(parse_qs(urlparse(req.url).query))
        body={'items':[CUSTOMER],'total':1,'page':1,'page_size':50}
    else: body={}
    route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps(body))

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel='chrome')
    context=browser.new_context(viewport={'width':1280,'height':1000},geolocation={'latitude':37.5,'longitude':127},permissions=['geolocation'])
    context.route('**/api/v1/**',route_api)
    context.route('**/*naver.com/**',lambda r:r.abort())
    context.add_init_script('''window.liveSources=[]; window.EventSource=class {
      constructor(url){this.url=url;this.listeners={};this.closed=false;window.liveSources.push(this);}
      addEventListener(name,callback){this.listeners[name]=callback;}
      close(){this.closed=true;}
      emit(data){this.listeners.snapshot({data:JSON.stringify(data)});}
    };''')
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/crm/customers')
    expect(page.get_by_text('미확정 주소',exact=True)).to_be_visible()
    page.locator('.MuiFormControl-root').filter(has=page.locator('label',has_text=re.compile('^보기$'))).get_by_role('combobox').click()
    page.get_by_role('option',name='미확정 주소만 보기',exact=True).click()
    page.wait_for_function('true')
    page.wait_for_timeout(250)
    assert any(q.get('unconfirmed_address')==['true'] for q in queries)
    page.get_by_role('tab',name='주변 고객 지도').click()
    page.get_by_role('button',name='내 위치',exact=True).click()
    expect(page.get_by_text('기준 위치: 현재 위치',exact=False)).to_be_visible()
    page.get_by_role('button',name='주변 고객 찾기',exact=True).click()
    page.wait_for_function('window.liveSources.length===1')
    snapshot={'items':[],'total':0,'page':1,'page_size':100,'address_progress':{'pending':2,'unresolved':0}}
    page.evaluate('(data)=>window.liveSources[0].emit(data)',snapshot)
    expect(page.get_by_text('주소 확인 대기·진행 2명',exact=False)).to_be_visible()
    located={**CUSTOMER,'address_resolution':{'status':'CONFIRMED'},'search_location':CUSTOMER['location'],'distance_km':0.1,'task_id':None}
    snapshot.update(items=[located],total=1,address_progress={'pending':1,'unresolved':0})
    page.evaluate('(data)=>window.liveSources[0].emit(data)',snapshot)
    expect(page.locator('#nearby-10-0')).to_be_visible()
    # A new radius closes the prior subscription; late messages cannot replace the new results.
    page.locator('.MuiFormControl-root').filter(has=page.locator('label',has_text=re.compile('^반경'))).get_by_role('spinbutton').fill('1')
    page.get_by_role('button',name='주변 고객 찾기',exact=True).click()
    page.wait_for_function('window.liveSources.length===2 && window.liveSources[0].closed')
    page.evaluate('(data)=>window.liveSources[0].emit(data)',snapshot)
    expect(page.locator('#nearby-10-0')).to_have_count(0)
    page.evaluate('(data)=>window.liveSources[1].emit(data)',{**snapshot,'items':[],'total':0,'address_progress':{'pending':0,'unresolved':1}})
    expect(page.get_by_text('미확정 주소 1명',exact=False)).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
    page.screenshot(path='/tmp/bojogae-address-live-ui.png',full_page=True)
    assert not errors,errors
    assert not writes,writes
    context.close();browser.close()
print('Live update, stale subscription, unconfirmed filter, mobile: passed; DB/provider calls: 0')
