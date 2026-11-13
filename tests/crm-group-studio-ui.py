"""Browser coverage with intercepted CRM calls. Start Vite on port 3317."""
import json
import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("CRM_UI_BASE", "http://127.0.0.1:3317")
CUSTOMERS = [
    {"id": i, "name": name, "version": 1, "archived": False, "stage": "CONSULTING",
     "phone": "01000000000", "resident_number": "760113-1",
     "updated_at": "2026-11-12T01:00:00Z", "created_at": "2026-11-10T01:00:00Z",
     "location": {"address": "서울시 테스트 주소"}, "contract_count": 1}
    for i, name in enumerate(["김테스트", "이테스트", "박테스트", "최테스트", "장테스트"], 1)
]
group = {"id": 9, "name": "상담 그룹", "color": "blue", "version": 1, "customers": []}
writes, searches, sorts, errors = [], [], [], []


def handle(route):
    request = route.request
    url = urlparse(request.url)
    path = url.path.split("/api/v1/")[-1]
    headers = {
        "Access-Control-Allow-Origin": BASE, "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
    }
    if request.method == "OPTIONS":
        return route.fulfill(status=204, headers=headers)
    body = {}
    if path == "auth/me":
        body = {"id": 7, "status": "ACTIVE", "role": "USER", "display_name": "UI 테스트",
                "email": "test@example.test", "group_id": None}
    elif path == "web-push/configuration":
        body = {"enabled": False}
    elif path == "crm/customers":
        query = parse_qs(url.query)
        sorts.extend(query.get("sort", []))
        current = {c["id"] for c in group["customers"]}
        customers = [
            {**c, "groups": [{"id": group["id"], "name": group["name"]}] if c["id"] in current else []}
            for c in CUSTOMERS if not query.get("group_id") or c["id"] in current
        ]
        body = {"items": customers, "total": len(customers), "page": 1, "page_size": 30}
    elif path == "crm/customer-groups/candidates/search":
        data = request.post_data_json
        searches.append(data)
        items = CUSTOMERS[2:] if data["q"] else CUSTOMERS
        ids = set(data["customer_ids"])
        if data.get("action") == "remove":
            items = [c for c in items if c["id"] in ids]
        elif data.get("action") == "add" or data["only_nonmembers"]:
            items = [c for c in items if c["id"] not in ids]
        body = {"items": items, "total": len(items), "page": 1, "page_size": 50}
    elif path == "crm/customer-groups":
        if request.method == "POST":
            data = request.post_data_json
            writes.append(data)
            group.update(name=data["name"], color=data["color"], version=1,
                         customers=[c for c in CUSTOMERS if c["id"] in data["customer_ids"]])
            body = group
        else:
            body = {"items": [{**group, "customer_count": len(group["customers"])}]}
    elif path == "crm/customer-groups/9":
        if request.method == "PUT":
            data = request.post_data_json
            writes.append(data)
            assert data["version"] == group["version"]
            group.update(name=data["name"], color=data["color"], version=group["version"] + 1,
                         customers=[c for c in CUSTOMERS if c["id"] in data["customer_ids"]])
        body = group
    elif request.method != "GET":
        raise AssertionError(f"Unexpected mutation: {path}")
    route.fulfill(status=200, headers=headers, content_type="application/json", body=json.dumps(body))


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=os.environ.get("PLAYWRIGHT_CHANNEL", "chrome"))
    context = browser.new_context(viewport={"width": 1280, "height": 1000})
    context.route("**/api/v1/**", handle)
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE + "/crm/customers")
    expect(page.get_by_role("columnheader")).to_have_count(7)
    page.get_by_label("정렬 기준", exact=True).select_option("created_asc")
    expect(page.get_by_role("checkbox", name="김테스트 고객 선택")).to_be_visible()

    def checkbox(name):
        return page.get_by_role("checkbox", name=f"{name} 고객 선택")

    checkbox("김테스트").click()
    checkbox("박테스트").click(modifiers=["Shift"])
    expect(checkbox("이테스트")).to_be_checked()
    expect(page.get_by_text("선택 3명", exact=True)).to_be_visible()
    page.get_by_role("button", name="선택 해제", exact=True).click()
    rows = page.locator("tr[data-selection-row]")
    rows.nth(0).locator("td").nth(2).click()
    expect(checkbox("김테스트")).to_be_checked()
    page.get_by_role("button", name="선택 해제", exact=True).click()
    first = rows.nth(0).locator("td").nth(2).bounding_box()
    last = rows.nth(2).locator("td").nth(2).bounding_box()
    x = first["x"] + first["width"] / 2
    page.mouse.move(x, first["y"] + first["height"] / 2)
    page.mouse.down()
    page.mouse.move(x, last["y"] + last["height"] / 2, steps=12)
    page.mouse.up()
    expect(page.get_by_text("선택 3명", exact=True)).to_be_visible()
    page.get_by_role("button", name="선택 그룹 등록", exact=True).click()
    dialog = page.get_by_role("dialog", name="스마트 고객 그룹 관리")
    expect(dialog.get_by_text("선택한 고객 3명", exact=False)).to_be_visible()
    assert not writes
    dialog.get_by_role("button", name="상담 그룹 0명").click()
    member_box = dialog.get_by_role("region", name="소속 고객", exact=True)
    expect(member_box.get_by_text("3명", exact=True)).to_be_visible()
    assert abs(dialog.locator(".group-studio-editor").bounding_box()["width"] /
               dialog.locator("aside").bounding_box()["width"] - 2) < 0.02
    assert round(dialog.bounding_box()["width"]) == 1180
    dialog.get_by_role("button", name="김**, 보험고객", exact=True).click()
    expect(dialog.get_by_label("추가할 고객 검색")).to_have_value("김**, 보험고객")
    dialog.get_by_role("button", name="검색어 지우기").click()
    expect(dialog.get_by_label("추가할 고객 검색")).to_have_value("")
    expect(dialog.get_by_label("그룹 색상", exact=True).locator("option")).to_have_text([
        "🟢 에메랄드 그린", "🟣 로열 바이올렛", "🟠 앰버 골드", "🔵 트러스트 블루", "🔴 코랄 레드",
    ])
    if out := os.environ.get("CRM_GROUP_SCREENSHOTS"):
        expect(dialog.get_by_text("검색 결과 5명")).to_be_visible()
        dialog.screenshot(path=Path(out) / "group-studio-desktop.png", animations="disabled")
    dialog.get_by_label("그룹 색상", exact=True).select_option("violet")
    dialog.get_by_label("추가할 고객 검색").fill("박*, 상담")
    dialog.get_by_role("button", name="하나 이상 (OR)").click()
    expect(dialog.get_by_text("검색 결과 3명")).to_be_visible()
    dialog.get_by_role("button", name="검색 고객 전체 추가").click()
    expect(member_box.get_by_text("5명", exact=True)).to_be_visible()
    dialog.get_by_role("button", name="일괄 제외").click()
    expect(member_box.get_by_text("2명", exact=True)).to_be_visible()
    assert not writes
    dialog.get_by_role("button", name="그룹 변경사항 저장").click()
    expect(dialog.get_by_text("고객 그룹을 저장했습니다.")).to_be_visible()
    assert writes == [{"name": "상담 그룹", "color": "violet", "customer_ids": [1, 2], "version": 1}]
    assert any(search.get("action") == "add" and search["logic"] == "OR" for search in searches)
    dialog.get_by_role("button", name="이 그룹만 메인 보기").click()
    expect(page.get_by_role("button", name="상담 그룹 2명")).to_have_attribute("data-group-color", "violet")
    expect(rows).to_have_count(2)
    assert "created_asc" in sorts

    for width in (360, 390, 430):
        page.set_viewport_size({"width": width, "height": 844})
        card = page.locator(".customer-list-card").first
        expect(card).to_be_visible()
        expect(page.get_by_label("정렬 기준", exact=True)).to_be_hidden()
        rects = card.evaluate("""el => {
          const r = selector => el.querySelector(selector).getBoundingClientRect().toJSON();
          return {header: r('.customer-list-card-heading'), stage: r('.crm-customer-stage'),
                  telephone: r('a[href^="tel:"]'), footer: r('.customer-list-card-footer')};
        }""")
        assert rects["stage"]["bottom"] <= rects["header"]["bottom"] < rects["telephone"]["top"]
        assert rects["telephone"]["right"] <= rects["footer"]["right"]
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.get_by_role("button", name="필터 ▼").click()
    expect(page.get_by_label("정렬 기준", exact=True)).to_be_visible()
    page.get_by_role("button", name="테이블 뷰").click()
    expect(page.get_by_role("columnheader")).to_have_count(7)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.get_by_role("button", name="고객 그룹 관리", exact=True).click()
    expect(dialog.get_by_role("button", name="1. 그룹 선택·생성")).to_be_visible()
    dialog.get_by_label("새 그룹 이름").fill("모바일 그룹")
    dialog.get_by_label("새 그룹 색상").select_option("amber")
    dialog.get_by_role("button", name="생성", exact=True).click()
    expect(dialog.get_by_role("button", name="2. 멤버 검색·추가")).to_have_attribute("aria-pressed", "true")
    expect(dialog.get_by_label("그룹 색상", exact=True)).to_have_value("amber")
    for width in (360, 390, 430):
        page.set_viewport_size({"width": width, "height": 844})
        expect(dialog.locator(".group-studio-editor")).to_be_visible()
        assert dialog.evaluate("el => el.scrollWidth <= el.clientWidth")
    if out:
        page.set_viewport_size({"width": 390, "height": 844})
        expect(dialog.get_by_text("검색 결과 5명")).to_be_visible()
        dialog.screenshot(path=Path(out) / "group-studio-mobile.png", animations="disabled")
    assert len(writes) == 1
    dialog.get_by_role("button", name="그룹 변경사항 저장").click()
    expect(dialog.get_by_text("고객 그룹을 저장했습니다.")).to_be_visible()
    assert writes[-1] == {"name": "모바일 그룹", "color": "amber", "customer_ids": []}
    dialog.get_by_role("button", name="그룹 설정 완료").click()
    page.get_by_role("button", name="자료 가져오기", exact=True).click()
    expect(page.get_by_role("button", name="엑셀 · CSV 파일 업로드", exact=False)).to_be_visible()
    assert not errors, errors
    print("Group Studio: desktop selection & save, 360/390/430px layout and mobile creation passed.")
    browser.close()
