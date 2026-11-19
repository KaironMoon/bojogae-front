import test from 'node:test';
import assert from 'node:assert/strict';
import { hasSignatureFields, personalizeSignature, SignatureProfileError } from '../src/services/signature-personalization.js';

const profile = { affiliation: '보험회사', branch_name: '서울지점', name: '홍설계', phone: '010-1234-5678' };

test('빠른 삽입과 추천 서명은 예시 대신 실제 내 정보를 본문에 넣는다', () => {
  assert.equal(personalizeSignature('🏢 현대홈쇼핑 GA 강대한지점\n담당: 김성춘\n전화: 010-9729-9649', profile),
    '🏢 보험회사 서울지점\n담당: 홍설계\n전화: 010-1234-5678');
});

test('기존에 저장된 대체 문구도 실제 내 정보로 바꾼다', () => {
  assert.equal(personalizeSignature('[소속] [지점] · [이름] · [전화번호]', profile, { examples: false }),
    '보험회사 서울지점 · 홍설계 · 010-1234-5678');
});

test('없는 정보는 대체 문구를 넣지 않고 빠진 항목을 알린다', () => {
  assert.throws(() => personalizeSignature('[소속] [지점] [전화번호]', { affiliation: ' ', phone: '' }),
    (error) => error instanceof SignatureProfileError && error.message === '소속·지점·전화번호 정보가 없습니다. 내 정보에 등록한 뒤 다시 넣어 주세요.');
  assert.throws(() => personalizeSignature('[이름]', null), /이름 정보가 없습니다/);
});

test('넣으려는 문구에서 사용하는 정보만 요구한다', () => {
  assert.equal(personalizeSignature('담당: 김성춘', { name: '홍설계' }), '담당: 홍설계');
  assert.equal(personalizeSignature('──────────────\n', null), '──────────────\n');
});

test('고객 이름 치환은 내 이름으로 바꾸지 않는다', () => {
  assert.equal(personalizeSignature('[[[이름]]] 고객님, [이름]입니다.', profile), '[[[이름]]] 고객님, 홍설계입니다.');
  assert.equal(hasSignatureFields('[[[이름]]] 고객님'), false);
});

test('기존 본문과 실제 프로필 값은 예시처럼 다시 치환하지 않는다', () => {
  assert.equal(personalizeSignature('김성춘 고객님께 [이름] 드림', profile, { examples: false }), '김성춘 고객님께 홍설계 드림');
  assert.equal(personalizeSignature('[소속] [이름]', { affiliation: '[이름]보험', name: '$& 설계사' }), '[이름]보험 $& 설계사');
});
