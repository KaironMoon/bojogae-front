"""Mock-only address/pin regression check; no database or real NAVER requests.
Run Vite separately on 127.0.0.1:3327, then run with a Python containing Playwright.
"""
import json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect
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
  else: body={'items':[{'title':'상현역 신분당선','address':'경기도 용인시 수지구 광교중앙로 312','lat':37.297,'lng':127.069,'accuracy':'APPROXIMATE'}, {'title':'상현역 근처','address':'경기도 용인시 수지구','lat':37.298,'lng':127.070,'accuracy':'APPROXIMATE'}]}
 elif path=='crm/nearby-customers':
  from urllib.parse import parse_qs
  nearby.append(parse_qs(urlparse(r.url).query)); body={'items':[],'total':0,'page':1,'page_size':100}
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
 elif path=='crm/configuration': body={'maps':{'enabled':True,'geocoding_enabled':True,'place_search_enabled':True,'key_id':'test'}}
 route.fulfill(status=status,headers=headers,content_type='application/json',body=json.dumps(body))
NAVER = r"""
class LatLng {constructor(lat,lng){this._lat=lat;this._lng=lng;}lat(){return this._lat;}lng(){return this._lng;}}
class TestMap {
 constructor(el,opts){window.testMap=this;this.el=el;this.handlers={};el.style.background='#edf3ef';el.textContent='테스트 지도';el.onclick=()=>{this.handlers.click?.({coord:new LatLng(37.567,126.979)});};}
 setSize(){} setCenter(){} setZoom(){} fitBounds(){window.testBounds=true;}
}
class Marker {constructor(opts){this.point=opts.position;this.handlers={};if(opts.icon?.content){this.el=opts.icon.content;opts.map.el.append(this.el);}else{window.testMarker=this;}}setPosition(p){this.point=p;}getPosition(){return this.point;}setMap(map){if(!map)this.el?.remove();}}
window.naver={maps:{Map:TestMap,Marker,LatLng,Point:class {},LatLngBounds:class {extend(){}},Circle:class {setMap(){}},Polyline:class {setMap(){}},Size:class {},Event:{addListener(obj,event,cb){obj.handlers[event]=cb;return {obj,event};},removeListener(l){delete l.obj.handlers[l.event];},clearInstanceListeners(obj){obj.handlers={};}}}};
"""

nearby=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel='chrome'); c=b.new_context(viewport={'width':1280,'height':1000})
 c.route('**/api/v1/**',handle); c.add_init_script(NAVER)
 page=c.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e))); page.set_default_timeout(10000)
 page.goto(base+'/crm/customers'); page.get_by_role('tab',name='주변 고객 지도',exact=True).click()
 page.get_by_label('검색 기준 주소·장소',exact=True).fill('상현역')
 page.get_by_role('button',name='위치 검색',exact=True).click()
 pins=page.locator('.crm-map-pin')
 pins.first.wait_for(); assert pins.count()==2
 assert page.evaluate('window.testBounds')
 label=pins.first.locator('.crm-map-pin__label')
 assert not label.is_visible()
 pins.first.hover(); assert label.is_visible()
 page.mouse.move(0,0); assert not label.is_visible()
 pins.first.click(); expect(pins).to_have_count(0)
 page.get_by_role('button',name='주변 고객 찾기',exact=True).click()
 page.get_by_text('직선거리 기준 0건 · 연락 중단·보관 고객 제외',exact=True).wait_for()
 assert nearby and nearby[-1]['lat']==['37.297'] and nearby[-1]['lng']==['127.069']
 assert searches==['상현역']
 # Place titles are display-only: saving a selected place must satisfy strict Location schema.
 page.goto(base+'/crm/customers'); page.get_by_role('button',name='고객 등록',exact=True).click()
 form=page.get_by_role('dialog',name='고객 등록',exact=True)
 form.get_by_label('고객명',exact=False).fill('장소 검색 테스트')
 form.get_by_label('주소',exact=True).fill('상현역')
 form.get_by_role('button',name='주소 검색',exact=True).click()
 picker=page.get_by_role('dialog',name='지도에서 위치 선택',exact=True)
 picker.get_by_role('button',name='상현역 신분당선 · 경기도 용인시 수지구 광교중앙로 312',exact=True).wait_for()
 assert picker.locator('.crm-map-pin').count()==2
 picker.locator('.crm-map-pin').first.click()
 picker.get_by_role('button',name='이 위치 사용',exact=True).click()
 form.get_by_role('button',name='저장',exact=True).click(); form.wait_for(state='hidden')
 assert 'title' not in saved[-1]['location'] and saved[-1]['location']['lat']==37.297
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/bojogae-place-search-ui.png',animations='disabled')
 assert not errors, errors
 print('UI passed: station search, named candidates, nearby coordinates, strict location save, mobile')
 b.close()
