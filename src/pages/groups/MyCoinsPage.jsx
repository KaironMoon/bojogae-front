import { Alert, Dialog, Pagination } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '@/services/api-caller';
import { groupErrorMessage } from '@/services/group-service';
import WalletReference from './kkomak/WalletReference';
import BalanceReference from './kkomak/BalanceReference';
import TransactionReference from './kkomak/TransactionReference';
import { amount, date } from './kkomak/wallet-format';
import './kkomak/wallet-utilities.css';
import './kkomak/wallet-source.css';
import './kkomak/wallet-integration.css';

const emptyLedger = { items: [], page: 1, total: 0, total_pages: 0, category_counts: {} };
const categories = { PLUS: '충전·지급', DOC: '문서생성', FAX: 'PC팩스', EXPIRE: '기간만료', OTHER: '기타' };

export default function MyCoinsPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [wallet, setWallet] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); setSearch(query); }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let active = true;
    setError(''); setLoading(true); setDetail(null);
    api.get('/api/v1/points/me/ledger', { page, category, q: search })
      .then(({ data }) => {
        if (!active) return;
        setDetail(data);
        if (data.wallet) setWallet(data.wallet);
        else setError('잔액 구성 정보를 불러오지 못했습니다. 서버 업데이트 상태를 확인해 주세요.');
      })
      .catch(e => { if (active) setError(groupErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, category, search]);

  async function exportLedger() {
    setExporting(true); setError('');
    try {
      const { data } = await api.get('/api/v1/points/me/ledger/export', { category, q: search }, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = '보조개_꼬막_입출금내역.csv';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(groupErrorMessage(e)); }
    finally { setExporting(false); }
  }

  const rows = loading ? <tr><td colSpan={5} className="py-12 text-center text-[#8b95a1]" role="status">꼬막 내역 조회 중…</td></tr> : <>
    {detail?.items.map(item => <tr key={item.id} className="MuiTableRow-root css-108w8ac tx-row-hover cursor-pointer" onClick={() => setTransaction(item)}>
      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[#8b95a1]">{date(item.occurred_at)}</td>
      <td className="py-3.5 px-4"><button type="button" className="wallet-transaction-trigger" onClick={event => { event.stopPropagation(); setTransaction(item); }} aria-label={`${item.description} 거래 상세`}><span className={`wallet-category wallet-category-${item.category}`}>{categories[item.category] || '기타'}</span><span>{item.description}</span></button></td>
      <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-primary">{item.credit ? `+${amount(item.credit)}` : '—'}</td>
      <td className={`py-3.5 px-4 text-right whitespace-nowrap font-extrabold ${item.category === 'EXPIRE' ? 'text-[#f04452]' : 'text-[#4e5968]'}`}>{item.debit ? `−${amount(item.debit)}` : '—'}</td>
      <td className="py-3.5 px-4 text-right whitespace-nowrap"><span className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] font-black text-[#121314]">{amount(item.balance_after)}</span></td>
    </tr>)}
    {!detail?.items.length && <tr><td colSpan={5} className="py-12 text-center text-[#8b95a1] font-bold">{error ? '꼬막 내역을 불러오지 못했습니다.' : '조건에 맞는 꼬막 거래 내역이 없습니다.'}</td></tr>}
  </>;
  return <div className="kkomak-design wallet-page" aria-busy={loading}>
    {error && <Alert severity="error" className="wallet-status">{error}</Alert>}
    {exporting && <p role="status" className="wallet-status">선택한 조건의 전체 거래 내역을 내보내는 중입니다.</p>}
    <WalletReference wallet={wallet} detail={detail || emptyLedger} rows={rows}
      pagination={<Pagination className="css-1xdhyk6 wallet-pagination" aria-label="pagination navigation" count={Math.max(1, detail?.total_pages || 1)} page={detail?.page || page} disabled={loading || !detail?.total_pages} onChange={(_, value) => setPage(value)} />}
      category={category} query={query} onQuery={setQuery} onCategory={value => { setPage(1); setCategory(value); }}
      onBalance={() => setBalanceOpen(true)} onExport={exportLedger} exporting={exporting || loading || !detail?.total} />
    <Dialog open={balanceOpen} onClose={() => setBalanceOpen(false)} aria-label="잔여 꼬막 상세" maxWidth={false} slotProps={{paper:{className:'kkomak-design wallet-modal wallet-balance-modal'}}}>
      <BalanceReference wallet={wallet} onClose={() => setBalanceOpen(false)} />
    </Dialog>
    <Dialog open={!!transaction} onClose={() => setTransaction(null)} aria-label="꼬막 거래 상세 내역" maxWidth={false} slotProps={{paper:{className:'kkomak-design wallet-modal wallet-transaction-modal'}}}>
      {transaction && <TransactionReference transaction={transaction} onClose={() => setTransaction(null)} />}
    </Dialog>
  </div>;
}
