"""Mock-only address/pin regression check; no database or real NAVER requests.
Run Vite separately on 127.0.0.1:3327, then run with a Python containing Playwright.
"""
import json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
base='http://127.0.0.1:3327'; saved=[]; searches=[]; navigations=[]; reverse_failure=False
def handle(route):
 r=route.request; path=urlparse(r.url).path.split('/api/v1/')[-1]
 headers={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'content-type'}
 status=200; body={}
 if r.method=='OPTIONS': route.fulfill(status=204,headers=headers); return
 if path=='auth/me': body={'id':9,'role':'USER','status':'ACTIVE','display_name':'테스트','email':'test@example.com','group_id':None}
 elif path=='crm/maps/reverse-geocode':
  raise AssertionError('reverse geocoding must not be called')
  if reverse_failure: status=502; body={'detail':'crm_maps_provider_error'}
  else: body={'address':'서울특별시 중구 세종대로 110',**r.post_data_json,'accuracy':'EXACT'}
 elif path in ('crm/maps/geocode', 'crm/maps/search'):
  query=r.post_data_json['query']; searches.append(query)
  if query=='실패': status=503; body={'detail':'crm_maps_unavailable'}
  elif query=='빈결과': body={'items':[]}
  else: body={'items':[{'address':'서울특별시 중구 세종대로 110','lat':37.5665,'lng':126.978,'accuracy':'APPROXIMATE'}]}
 elif path=='crm/customers/duplicates': body={'items':[]}
 elif path=='crm/birth-date/normalize': body=r.post_data_json
 elif path=='crm/customers' and r.method=='POST': saved.append(r.post_data_json); body={'id':1,**r.post_data_json}
 elif path=='crm/customers': body={'items':[],'total':0,'page':1,'page_size':50}
 elif path=='crm/customers/1':
  body={**saved[-1], 'id':1,'version':1,'archived':False,'consultations':[], 'contracts':{'items':[],'total':0},'tasks':{'items':[],'total':0},'premium_summary':{'monthly_known':'0','unknown_count':0}}
 elif path=='web-push/configuration': body={'enabled':False}
 elif path=='crm/maps/navigation-link':
  navigations.append(r.post_data_json)
  body={'web':'https://map.naver.com/p/directions/test'}
 elif path=='crm/configuration': body={'maps':{'enabled':True,'geocoding_enabled':True,'key_id':'test'}}
 route.fulfill(status=status,headers=headers,content_type='application/json',body=json.dumps(body))
NAVER = r"""
class LatLng {constructor(lat,lng){this._lat=lat;this._lng=lng;}lat(){return this._lat;}lng(){return this._lng;}}
class TestMap {
 constructor(el,opts){this.el=el;this.handlers={};el.style.background='#edf3ef';el.textContent='테스트 지도';el.onclick=()=>{this.handlers.click?.({coord:new LatLng(37.567,126.979)});};}
 setSize(){} setCenter(){} setZoom(){}
}
class Marker {constructor(opts){this.point=opts.position;this.handlers={};window.testMarker=this;}setPosition(p){this.point=p;}getPosition(){return this.point;}setMap(){}}
window.naver={maps:{Map:TestMap,Marker,LatLng,Size:class {},Event:{addListener(obj,event,cb){obj.handlers[event]=cb;return {obj,event};},removeListener(l){delete l.obj.handlers[l.event];},clearInstanceListeners(obj){obj.handlers={};}}}};
"""
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel='chrome'); c=b.new_context(viewport={'width':1280,'height':1000}); c.route('**/api/v1/**',handle); c.add_init_script(NAVER)
 page=c.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e))); page.set_default_timeout(10000)
 def new_form():
  page.goto(base+'/crm/customers'); page.get_by_role('button',name='고객 등록',exact=True).click()
  form=page.get_by_role('dialog',name='고객 등록',exact=True,include_hidden=True)
  form.get_by_label('고객명',exact=False).fill('위치 테스트'); form.get_by_label('연락처',exact=True).fill('01012345678')
  return form

 def picker_for(form):
  form.get_by_role('button',name='주소 검색',exact=True).click()
  picker=page.get_by_role('dialog',name='지도에서 위치 선택',exact=True)
  picker.get_by_role('button',name='서울특별시 중구 세종대로 110',exact=True).wait_for()
  return picker
 def save(form):
  form.get_by_role('button',name='저장',exact=True).click(); form.wait_for(state='hidden')
 # An untouched search result saves its approximate coordinates.
 form=new_form(); form.get_by_label('주소',exact=True).fill('세종대로 110'); picker=picker_for(form)
 picker.get_by_role('button',name='이 위치 사용',exact=True).click(); save(form)
 assert saved[-1]['location']=={'address':'서울특별시 중구 세종대로 110','lat':37.5665,'lng':126.978,'accuracy':'APPROXIMATE'}
 # Untouched search pins use the original address for directions, never the cached pin.
 page.goto(base+'/crm/customers/1')
 before=len(searches); before_saved=len(saved)
 page.get_by_role('button',name='길찾기',exact=True).first.click()
 directions=page.get_by_role('dialog',name='네이버 지도 길찾기',exact=True)
 directions.get_by_role('link',name='네이버 지도에서 열기',exact=True).wait_for()
 assert len(searches)==before+1 and len(saved)==before_saved
 assert searches[-1]=='서울특별시 중구 세종대로 110'
 assert navigations[-1]['destination']['lat']==37.5665
 directions.get_by_role('button',name='닫기',exact=True).click()
 # Explicit move persists only the moved pin, with the searched address retained.
 form=new_form(); form.get_by_label('주소',exact=True).fill('세종대로 110'); picker=picker_for(form)
 picker.get_by_role('region',name='위치 선택 지도').click()
 picker.get_by_role('button',name='이 위치 사용',exact=True).click(); save(form)
 assert saved[-1]['location']=={'address':'서울특별시 중구 세종대로 110','lat':37.567,'lng':126.979,'accuracy':'EXACT'}
 # Moved pins use their stored coordinates for directions without address lookup.
 page.goto(base+'/crm/customers/1'); before=len(searches)
 page.get_by_role('button',name='길찾기',exact=True).first.click()
 directions.get_by_role('link',name='네이버 지도에서 열기',exact=True).wait_for()
 assert len(searches)==before
 assert navigations[-1]['destination']['lat']==37.567
 directions.get_by_role('button',name='닫기',exact=True).click()
 # Direct edit still prompts before removing a confirmed location; cancel preserves it.
 form=new_form(); form.get_by_label('주소',exact=True).fill('세종대로 110'); picker=picker_for(form)
 picker.get_by_role('region',name='위치 선택 지도').click(); picker.get_by_role('button',name='이 위치 사용',exact=True).click()
 form.get_by_label('주소',exact=True).fill('직접 고친 주소')
 confirm=page.get_by_role('dialog',name='주소를 수정할까요?',exact=True); confirm.wait_for()
 confirm.get_by_role('button',name='취소',exact=True).click()
 assert form.get_by_label('주소',exact=True).input_value()=='서울특별시 중구 세종대로 110'
 # Reopening a saved pin does not geocode or clear its coordinates.
 before=len(searches)
 form.get_by_role('button',name='주소 검색',exact=True).click(); picker.get_by_text('테스트 지도',exact=True).wait_for()
 picker.get_by_role('button',name='이 위치 사용',exact=True).click(); assert len(searches)==before
 form.get_by_label('주소',exact=True).fill('직접 고친 주소'); confirm.wait_for(); confirm.get_by_role('button',name='수정',exact=True).click(); save(form)
 assert saved[-1]['location']=={'address':'직접 고친 주소','lat':None,'lng':None,'accuracy':'NONE'}
 # Reselecting a search result resets the pin source to approximate.
 form=new_form(); form.get_by_label('주소',exact=True).fill('세종대로 110'); picker=picker_for(form)
 picker.get_by_role('region',name='위치 선택 지도').click()
 picker.get_by_role('button',name='검색',exact=True).click()
 picker.get_by_role('button',name='서울특별시 중구 세종대로 110',exact=True).wait_for()
 picker.get_by_role('button',name='이 위치 사용',exact=True).click(); save(form)
 assert saved[-1]['location']['lat']==37.5665 and saved[-1]['location']['accuracy']=='APPROXIMATE'
 # Cancelling the dialog discards all local pin changes, including on mobile.
 form=new_form(); form.get_by_label('주소',exact=True).fill('세종대로 110'); picker=picker_for(form)
 picker.get_by_role('region',name='위치 선택 지도').click(); page.set_viewport_size({'width':390,'height':844})
 assert picker.evaluate('(el) => el.scrollWidth <= el.clientWidth')
 page.screenshot(path='/tmp/bojogae-pin-policy-mobile.png',animations='disabled')
 picker.get_by_role('button',name='취소',exact=True).click(); save(form)
 assert saved[-1]['location']=={'address':'세종대로 110','lat':None,'lng':None,'accuracy':'NONE'}
 # A drag event without actual movement must retain approximate accuracy.
 form=new_form(); form.get_by_label('주소',exact=True).fill('세종대로 110'); picker=picker_for(form)
 page.evaluate("window.testMarker.handlers.dragend()")
 assert picker.get_by_role('button',name='이 위치 사용',exact=True).is_visible()
 page.evaluate("window.testMarker.setPosition(new window.naver.maps.LatLng(37.568,126.980)); window.testMarker.handlers.dragend()")
 picker.get_by_role('button',name='이 위치 사용',exact=True).click(); save(form)
 assert saved[-1]['location']['lat']==37.568 and saved[-1]['location']['accuracy']=='EXACT'
 assert not errors, errors
 print('UI passed: search coordinates saved, moved pin updated, original-address directions, moved-pin directions, reselect, cancel, edit warning, mobile')
 b.close()
