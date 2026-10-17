import test from 'node:test';
import assert from 'node:assert/strict';
import { activeClaimPayload, claimInputErrors, claimErrorStep, validClaimPhone, claimAgeFromIdentity, claimNeedsGuardian,
  formatClaimInput, formatClaimInputEdit } from '../src/services/claim-validation.js';

const valid = { insured_name: '시험고객', insured_id: '9001011000000', insured_phone: '01012345678',
  insured_signature: 'test', beneficiary_same: true, notice_target: 'insured', accident_type: '질병',
  accident_date: '2026-01-01', accident_description: '테스트', bank_name: '시험은행', account_number: '123-456',
  account_holder: '시험고객', consent: true };
const today = new Date(2026, 9, 18);

test('주민번호 입력·붙여넣기의 구분자를 정리하고 13자리로 제한한다', () => {
  assert.equal(formatClaimInput('insured_id', '130725'), '130725');
  assert.equal(formatClaimInput('insured_id', '1307253'), '130725-3');
  assert.equal(formatClaimInput('beneficiary_id', ' 130725 - 3000000 '), '130725-3000000');
  assert.equal(formatClaimInput('insured_id', '1307253000000999'), '130725-3000000');
  assert.equal(claimNeedsGuardian(formatClaimInput('insured_id', '1307253000000'), today), true);
});

test('모든 연락처에 휴대전화·서울·지역번호 하이픈을 적용한다', () => {
  for (const key of ['insured_phone', 'beneficiary_phone', 'insured_guardian_phone', 'beneficiary_guardian_phone', 'planner_phone']) {
    for (const [raw, expected] of [['01012345678', '010-1234-5678'], ['010 1234 5678', '010-1234-5678'],
      ['021234567', '02-123-4567'], ['0212345678', '02-1234-5678'], ['0311234567', '031-123-4567']]) {
      assert.equal(formatClaimInput(key, raw), expected);
    }
  }
  assert.equal(formatClaimInput('insured_phone', ''), '');
  assert.equal(formatClaimInput('insured_phone', '0101'), '010-1');
  assert.equal(formatClaimInput('account_number', '12345678'), '12345678');
});

test('하이픈 앞뒤 삭제와 중간 삽입 시 커서를 유지한다', () => {
  assert.deepEqual(formatClaimInputEdit('insured_id', '1307253000000', '130725-3000000', 6, 'deleteContentBackward'),
    { value: '130723-000000', selectionStart: 5 });
  assert.deepEqual(formatClaimInputEdit('insured_id', '1307253000000', '130725-3000000', 6, 'deleteContentForward'),
    { value: '130725-000000', selectionStart: 6 });
  assert.deepEqual(formatClaimInputEdit('insured_phone', '0109-1234-5678', '010-1234-5678', 4, 'insertText'),
    { value: '010-9123-4567', selectionStart: 5 });
  assert.deepEqual(formatClaimInputEdit('insured_phone', '', '010-1234-5678', 0, 'deleteContentBackward'),
    { value: '', selectionStart: 0 });
});

test('짧거나 잘못된 연락처는 인적사항 단계에서 차단한다', () => {
  for (const phone of ['', '010123456', 'abcdefghijk']) {
    const errors = claimInputErrors({ ...valid, insured_phone: phone }, 1);
    assert.match(errors.insured_phone, /피보험자 연락처/);
    assert.equal(claimErrorStep(errors), 1);
  }
});
test('하이픈 유무와 관계없이 유효한 연락처를 허용한다', () => {
  for (const phone of ['01012345678', '010-1234-5678', '02-123-4567', '021234567']) assert.equal(validClaimPhone(phone), true);
  assert.deepEqual(claimInputErrors(valid, 2, today), {});
});
test('별도 수익자와 설계사 연락처도 검증하며 비활성 입력은 무시한다', () => {
  const errors = claimInputErrors({ ...valid, beneficiary_same: false, beneficiary_phone: '123', notice_target: 'planner', planner_phone: '123' }, 1);
  assert.ok(errors.beneficiary_phone && errors.planner_phone);
  assert.deepEqual(claimInputErrors({ ...valid, beneficiary_phone: '123', planner_phone: '123' }, 1), {});
});
test('최종 생성 검증은 이전 단계의 오류를 놓치지 않는다', () => {
  const errors = claimInputErrors({ ...valid, insured_phone: '123', consent: false }, 2, today);
  assert.ok(errors.insured_phone && errors.consent);
  assert.equal(claimErrorStep(errors), 1);
});
test('사고일·계좌 등 최종 입력 오류는 해당 단계에서 차단한다', () => {
  const errors = claimInputErrors({ ...valid, accident_date: '2026-02-30', account_number: '---' }, 2, today);
  assert.ok(errors.accident_date && errors.account_number);
  assert.equal(claimErrorStep(errors), 2);
  assert.ok(claimInputErrors({ ...valid, accident_date: '2099-01-01' }, 2, today).accident_date);
});

test('비활성 수익자·설계사 입력은 서버로 보내지 않는다', () => {
  const p = { ...valid, beneficiary_phone: 'invalid', planner_phone: 'invalid' };
  const result = activeClaimPayload(p);
  assert.equal(result.beneficiary_phone, '');
  assert.equal(result.planner_phone, '');
  assert.equal(p.planner_phone, 'invalid');
});

test('주민번호 앞 7자리로 만 14세 생일 전날·당일·다음 날을 구분한다', () => {
  assert.equal(claimAgeFromIdentity('121018-3', new Date(2026, 9, 17)), 13);
  assert.equal(claimNeedsGuardian('1210183000000', new Date(2026, 9, 17)), true);
  assert.equal(claimNeedsGuardian('121018-3000000', today), false);
  assert.equal(claimAgeFromIdentity('1210184000000', new Date(2026, 9, 19)), 14);
  assert.equal(claimAgeFromIdentity('0010181000000', today), 126);
  assert.equal(claimAgeFromIdentity('0010183000000', today), 26);
  assert.equal(claimNeedsGuardian('2010187000000', today), true);
});

test('미완성·잘못된 생년월일·미래 생년월일을 미성년으로 오판하지 않는다', () => {
  for (const value of ['', '121018', '1202303000000', '9912313000000', '12a0183000000']) {
    assert.equal(claimAgeFromIdentity(value, today), null);
    assert.equal(claimNeedsGuardian(value, today), false);
  }
  assert.ok(claimInputErrors({ ...valid, insured_id: '1202303000000' }, 1, today).insured_id);
  assert.equal(claimAgeFromIdentity('1202293000000', today), 14);
});

test('만 14세 미만 피보험자·별도 수익자는 각각 법정대리인 정보가 필요하다', () => {
  const minor = { ...valid, insured_id: '1210193000000' };
  const errors = claimInputErrors(minor, 1, today);
  assert.ok(errors.insured_guardian_name && errors.insured_guardian_relationship && errors.insured_guardian_phone);
  assert.equal(claimErrorStep(errors), 1);
  assert.deepEqual(claimInputErrors({ ...minor, insured_guardian_name: '시험보호자',
    insured_guardian_relationship: '모', insured_guardian_phone: '010-1234-5678', insured_guardian_signature: 'guardian-test' }, 1, today), {});
  const beneficiary = { ...valid, beneficiary_same: false, beneficiary_name: '시험수익자',
    beneficiary_id: '2010184000000', beneficiary_phone: '01012345678', beneficiary_signature: 'test' };
  assert.ok(claimInputErrors(beneficiary, 2, today).beneficiary_guardian_name);
});

test('성인 변경·수익자 동일 선택 시 비활성 법정대리인 정보는 전송하지 않는다', () => {
  const p = { ...valid, insured_guardian_name: '이전보호자', insured_guardian_phone: '123',
    beneficiary_id: '2010183000000', beneficiary_guardian_name: '숨겨진보호자' };
  assert.deepEqual(claimInputErrors(p, 1, today), {});
  assert.equal(activeClaimPayload(p, today).insured_guardian_name, '');
  assert.equal(activeClaimPayload(p, today).beneficiary_guardian_name, '');
  assert.equal(p.insured_guardian_name, '이전보호자');
  assert.equal(activeClaimPayload({ ...p, insured_id: '2010183000000' }, today).insured_guardian_name, '이전보호자');
});

test('성인은 법정대리인을 수동 추가하며 미성년자는 대리인 서명으로 제출할 수 있다', () => {
  const guardian = { insured_guardian_name: '보호자', insured_guardian_relationship: '모',
    insured_guardian_phone: '01012345678', insured_guardian_signature: 'guardian-signature' };
  const manual = { ...valid, ...guardian, insured_guardian_enabled: true };
  assert.deepEqual(claimInputErrors(manual, 1, today), {});
  assert.equal(activeClaimPayload(manual, today).insured_guardian_signature, 'guardian-signature');
  assert.equal('insured_guardian_enabled' in activeClaimPayload(manual, today), false);
  const child = { ...valid, ...guardian, insured_id: '2001013000000', insured_signature: '' };
  assert.deepEqual(claimInputErrors(child, 1, today), {});
  assert.ok(claimInputErrors({ ...child, insured_guardian_signature: '' }, 1, today).insured_guardian_signature);
});
