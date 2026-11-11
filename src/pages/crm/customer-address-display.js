// Address confirmation and coordinate accuracy are separate server-owned facts.
export function customerAddressDisplay(customer) {
  const location = customer?.location || {};
  const status = customer?.address_resolution?.status;
  const states = {
    CONFIRMED: { state: 'confirmed', label: '확정 주소' },
    PENDING: { state: 'pending', label: '주소 확인 대기' },
    PROCESSING: { state: 'pending', label: '주소 확인 중' },
    UNRESOLVED: { state: 'unresolved', label: '미확정 주소' },
  };
  if (states[status]) return states[status];
  // Older records may have saved coordinates without resolution metadata.
  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return states.CONFIRMED;
  }
  return location.address?.trim()
    ? { state: 'registered', label: '주소 등록됨' }
    : { state: 'empty', label: '주소 미등록' };
}
