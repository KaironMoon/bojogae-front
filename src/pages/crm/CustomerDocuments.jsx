/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import ContractDesignIcon from "./ContractDesignIcon";
import { useCrm, State, Pages } from "./CrmShared";
import { ContractForm } from "./CrmForms";
import { crmPost } from "@/services/crm-service";
import { proposalFileUrl } from "@/services/proposal-service";
import { CYCLES, MAINTENANCE, PROGRESS, dateTime, money } from "./crm-utils";

const STATUS_META = {
  QUEUED: { label: "대기 중", tone: "running" },
  RUNNING: { label: "생성 중", tone: "running" },
  CANCEL_REQUESTED: { label: "취소 중", tone: "neutral" },
  COMPLETED: { label: "생성 완료", tone: "completed" },
  FAILED: { label: "생성 실패", tone: "failed" },
  CANCELLED: { label: "취소됨", tone: "neutral" },
};

function ContractLinkCard({ contract }) {
  const statusLabels = [
    contract.origin === "NEW" ? "신규 진행" : "기존 가입",
    PROGRESS[contract.progress],
    MAINTENANCE[contract.maintenance],
    contract.archived ? "보관됨" : null,
  ].filter(Boolean);

  return (
    <Link
      to={`/crm/contracts/${contract.id}`}
      className={`crm-doc-contract-link${contract.archived ? " is-archived" : ""}`}
    >
      <div className="crm-doc-contract-main">
        <div className="crm-doc-contract-head">
          {contract.insurer && (
            <span className="crm-doc-contract-insurer">{contract.insurer}</span>
          )}
          <strong className="crm-doc-contract-product">
            {contract.product || "상품명 미등록"}
          </strong>
        </div>
        <div className="crm-doc-contract-meta">
          {statusLabels.map((label) => (
            <span key={label} className="crm-doc-contract-chip">
              {label}
            </span>
          ))}
          {contract.premium_monthly != null && (
            <span className="crm-doc-contract-premium">
              월 {money(contract.premium_monthly)}원
              {contract.payment_cycle && CYCLES[contract.payment_cycle]
                ? ` (${CYCLES[contract.payment_cycle]})`
                : ""}
            </span>
          )}
          {contract.establishment_date && (
            <span className="crm-doc-contract-date">
              성립 {contract.establishment_date}
            </span>
          )}
        </div>
      </div>
      <span className="crm-doc-contract-arrow">계약 상세 보기 →</span>
    </Link>
  );
}

export default function CustomerDocuments({
  customerId,
  disabled = false,
  onSaved,
  compact = false,
}) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const resource = useCrm(`/customers/${customerId}/documents`, { page });
  const items = resource.data?.items || [];
  const total = resource.data?.total ?? 0;
  const contractedCount = items.filter((doc) =>
    (doc.contracts || []).some((contract) => !contract.archived),
  ).length;

  return (
    <div className={`crm-doc-wrap${compact ? " crm-doc-wrap--compact" : ""}`}>
      <div className="crm-doc-toolbar">
        <div className="crm-doc-toolbar-title">
          <span className="crm-doc-toolbar-icon" aria-hidden="true">
            <ContractDesignIcon name="document" />
          </span>
          <div>
            <div className="crm-doc-toolbar-heading">
              <h3>생성 문서</h3>
              <span className="crm-doc-count-pill">총 {total}건</span>
              {contractedCount > 0 && (
                <span className="crm-doc-contracted-count">
                  계약 연결 {contractedCount}건
                </span>
              )}
            </div>
            <p>AI 보고서 생성 내역과 연결된 계약 상태를 확인합니다.</p>
          </div>
        </div>
        <div className="crm-doc-toolbar-actions">
          <Button
            size="small"
            variant="outlined"
            className="crm-doc-refresh-btn"
            onClick={resource.reload}
          >
            새로고침
          </Button>
          <Button
            size="small"
            variant="contained"
            className="crm-doc-create-btn"
            component={Link}
            to={`/proposals?customerId=${customerId}`}
            disabled={disabled}
            startIcon={<ContractDesignIcon name="sparkles" />}
          >
            새 문서 생성
          </Button>
        </div>
      </div>

      <State resource={resource} />

      <div className="crm-doc-list">
        {items.map((doc) => {
          const allContracts = Array.isArray(doc.contracts) ? doc.contracts : [];
          const activeContracts = allContracts.filter((contract) => !contract.archived);
          const hasActiveContract = activeContracts.length > 0;
          const statusInfo = STATUS_META[doc.status] || {
            label: doc.status || "알 수 없음",
            tone: "neutral",
          };

          return (
            <article
              key={doc.id}
              className={`crm-doc-card${hasActiveContract ? " crm-doc-card--contracted" : ""}`}
            >
              <div className="crm-doc-card-head">
                <div className="crm-doc-card-title-block">
                  <div className="crm-doc-card-badges">
                    <span className={`crm-doc-status crm-doc-status--${statusInfo.tone}`}>
                      {statusInfo.label}
                    </span>
                    {doc.prompt_title && (
                      <span className="crm-doc-prompt-pill">{doc.prompt_title}</span>
                    )}
                    {hasActiveContract ? (
                      <span className="crm-doc-contract-badge crm-doc-contract-badge--done">
                        ✓ 계약 등록 완료
                        {activeContracts.length > 1 ? ` (${activeContracts.length}건)` : ""}
                      </span>
                    ) : allContracts.length > 0 ? (
                      <span className="crm-doc-contract-badge crm-doc-contract-badge--archived">
                        보관 계약 연결
                      </span>
                    ) : doc.status === "COMPLETED" ? (
                      <span className="crm-doc-contract-badge crm-doc-contract-badge--pending">
                        계약 미등록
                      </span>
                    ) : null}
                  </div>
                  <h4 className="crm-doc-card-title">{doc.title || `생성 문서 #${doc.id}`}</h4>
                </div>
                <time className="crm-doc-card-time" dateTime={doc.created_at}>
                  {dateTime(doc.created_at)}
                </time>
              </div>

              {doc.summary && <p className="crm-doc-summary">{doc.summary}</p>}

              {allContracts.length > 0 && (
                <div className="crm-doc-contracts">
                  <span className="crm-doc-contracts-label">연결된 보험 계약</span>
                  <div className="crm-doc-contracts-list">
                    {allContracts.map((contract) => (
                      <ContractLinkCard key={contract.id} contract={contract} />
                    ))}
                  </div>
                </div>
              )}

              <div className="crm-doc-card-actions">
                <div className="crm-doc-card-actions-left">
                  <Button
                    size="small"
                    variant="outlined"
                    className="crm-doc-btn-secondary"
                    component={Link}
                    to={`/proposals?generationId=${doc.id}`}
                    startIcon={<ContractDesignIcon name="info" />}
                  >
                    문서 상세
                  </Button>
                  {doc.status === "COMPLETED" && (
                    <Button
                      size="small"
                      variant="outlined"
                      className="crm-doc-btn-secondary"
                      component="a"
                      href={proposalFileUrl(doc.id, "output")}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<ContractDesignIcon name="sheet" />}
                    >
                      보고서 열기
                    </Button>
                  )}
                </div>
                <div className="crm-doc-card-actions-right">
                  {hasActiveContract ? (
                    <Button
                      size="small"
                      variant="contained"
                      className="crm-doc-btn-contracted"
                      component={Link}
                      to={`/crm/contracts/${activeContracts[0].id}`}
                      startIcon={<ContractDesignIcon name="check" />}
                    >
                      연결된 계약 보기
                    </Button>
                  ) : doc.status === "COMPLETED" ? (
                    <Button
                      size="small"
                      variant="contained"
                      className="crm-doc-btn-register"
                      disabled={disabled}
                      onClick={() => setSelected(doc)}
                      startIcon={<ContractDesignIcon name="folder_plus" />}
                    >
                      이 문서로 계약 등록
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {resource.data?.total === 0 && (
        <div className="crm-doc-empty">
          <span className="crm-doc-empty-icon" aria-hidden="true">
            <ContractDesignIcon name="document" />
          </span>
          <p>이 고객에게 연결된 생성 문서가 아직 없습니다.</p>
          <small>
            제안서·증권 분석 문서를 생성하면 이곳에서 바로 확인하고 계약을 등록할 수 있습니다.
          </small>
          <Button
            size="small"
            variant="contained"
            className="crm-doc-create-btn"
            component={Link}
            to={`/proposals?customerId=${customerId}`}
            disabled={disabled}
            startIcon={<ContractDesignIcon name="sparkles" />}
          >
            AI 보고서 생성하기
          </Button>
        </div>
      )}

      <Pages data={resource.data} onChange={setPage} />

      {selected && (
        <ContractForm
          customerId={customerId}
          initialDocument={selected}
          onClose={() => setSelected(null)}
          onSave={async (data) => {
            await crmPost("/contracts", data);
            resource.reload();
            onSaved?.();
          }}
        />
      )}
    </div>
  );
}
