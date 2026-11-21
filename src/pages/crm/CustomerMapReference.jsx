/* eslint-disable react/prop-types */
import { Button, Chip } from "@mui/material";
import { CustomerField } from "./CustomerReference";
import Icon from "./ContractDesignIcon";
import { STAGES } from "./crm-utils";
import "./customer-map-reference.css";

// Presentation follows the supplied 주변고객 개편안; all business actions are props.
export default function CustomerMapReference({
  address = "", radius = "3", mode = "CUSTOMERS", stage = "", tag = "", tasks = "", hasContract = "",
  filtersOpen = false, pane = "map", busy = false, canSearch = false, searching = false,
  origin, total = 0, onAddress, onRadius, onMode, onStage, onTag, onTasks, onHasContract,
  onFilters, onPane, onGeocode, onLocate, onSearch, candidates, notices, map, selected, list,
}) {
  return <div className="customer-map-reference">
    <section className="customer-map-search ns-card" aria-label="주변 고객 검색">
      <div className="search-row-grid">
        <CustomerField id=":r3j:" label="검색 기준 주소·장소" placeholder="예: 상현역, 법조로 252" value={address} onChange={onAddress} />
        <div className="customer-map-search-actions">
          <Button onClick={onGeocode} disabled={busy || !canSearch || address.length < 2}><Icon name="search" />{busy ? "검색 중…" : "위치 검색"}</Button>
          <Button onClick={onLocate} disabled={busy}><Icon name="pin" />내 위치</Button>
          <Button className="customer-map-filter-toggle" onClick={onFilters} aria-expanded={filtersOpen} aria-controls="customer-map-filters">상세필터 {filtersOpen ? "▴" : "▾"}</Button>
        </div>
        <div className="customer-map-radius" aria-label="빠른 반경 선택">{[1, 3, 5, 10].map(km => <button type="button" key={km} aria-pressed={Number(radius) === km} onClick={() => onRadius?.(String(km))}>{km}km</button>)}</div>
      </div>
      {!!candidates?.length && <div className="customer-map-candidates">{candidates}</div>}
      <div id="customer-map-filters" className={`detail-filters-grid${filtersOpen ? " is-open" : ""}`}>
        <CustomerField id=":r3m:" label="반경 (km)" value={radius} type="number" inputProps={{ min: 0.1, max: 100, step: 0.1 }} onChange={onRadius} />
        <CustomerField id=":r3n:" label="위치 기준" value={mode} options={{ CUSTOMERS: "고객 기본주소", VISITS: "예정 방문 장소" }} onChange={onMode} />
        <CustomerField id=":r3p:" label="상담 단계" value={stage} options={{ "": "전체", ...STAGES }} onChange={onStage} />
        <CustomerField id=":r3r:" label="태그" value={tag} placeholder="예: 가족, 실손" onChange={onTag} />
        <CustomerField id=":r3t:" label="계약 보유" value={hasContract} options={{ "": "전체", true: "보유", false: "미보유" }} onChange={onHasContract} />
        <CustomerField id=":r3v:" label="업무 필터" value={tasks} options={{ "": "전체", CALL: "재연락 예정", OVERDUE: "기한 초과", TODAY_VISIT: "오늘 방문" }} onChange={onTasks} />
      </div>
      <div className="customer-map-search-footer"><p><Icon name="pin" />{origin?.address || (origin ? "선택한 위치" : "주소 검색·내 위치·지도 선택으로 기준 위치를 지정하세요.")}</p><Button className="crm-customer-primary" variant="contained" disabled={!origin || searching} onClick={onSearch}>{searching ? "검색 중…" : "주변 고객 찾기"}</Button></div>
    </section>
    {notices}
    <div className="customer-map-mobile-tabs" role="tablist" aria-label="지도와 고객 목록 전환">
      <button type="button" role="tab" id="customer-map-tab" aria-selected={pane === "map"} aria-controls="customer-map-pane" onClick={() => onPane?.("map")}>지도 보기</button>
      <button type="button" role="tab" id="customer-list-tab" aria-selected={pane === "list"} aria-controls="customer-list-pane" onClick={() => onPane?.("list")}>주변 고객 목록 ({total})</button>
    </div>
    <div className={`map-and-list-grid customer-map-pane-${pane}`}>
      <section id="customer-map-pane" aria-label="주변 고객 지도" className="customer-map-canvas-panel"><div className="customer-map-canvas">{map}{selected && <div className="customer-map-floating-card">{selected}</div>}</div><p className="customer-map-hint">지도를 누르면 검색 기준 위치를 선택할 수 있습니다. 거리는 직선거리 기준입니다.</p></section>
      <section id="customer-list-pane" className="customer-map-results" aria-label="주변 고객 목록"><header><div><Icon name="users" /><h3>주변 고객</h3><Chip size="small" label={`${total}명`} /></div><span>반경 {radius}km</span></header><div className="customer-map-result-body">{list || <p className="customer-map-empty">기준 위치를 선택하고 주변 고객을 찾아보세요.</p>}</div></section>
    </div>
  </div>;
}
