import test from 'node:test';
import assert from 'node:assert/strict';
import { signatureImageType, signatureImageRect, hasSignatureInk, normalizeSignatureImage,
  MAX_SIGNATURE_FILE_BYTES } from '../src/services/signature-image.js';

test('확장자가 아닌 실제 파일 헤더로 PNG·JPEG·WEBP를 판별한다', () => {
  assert.equal(signatureImageType(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(signatureImageType(Uint8Array.from([255, 216, 255, 224])), 'image/jpeg');
  assert.equal(signatureImageType(new TextEncoder().encode('RIFFxxxxWEBP')), 'image/webp');
  assert.throws(() => signatureImageType(new TextEncoder().encode('<svg></svg>')), /PNG/);
  assert.throws(() => signatureImageType(new Uint8Array()), /PNG/);
});

test('가로·세로 이미지 모두 비율을 유지하며 서명 영역에 들어간다', () => {
  for (const [width, height] of [[1200, 200], [100, 900], [500, 500]]) {
    const rect = signatureImageRect(width, height);
    assert.ok(Math.abs(rect.width / rect.height - width / height) < 1e-8);
    assert.ok(rect.x >= 8 && rect.y >= 8);
    assert.ok(rect.x + rect.width <= 592 && rect.y + rect.height <= 162);
  }
  assert.throws(() => signatureImageRect(10000, 10000), /화소/);
  assert.throws(() => signatureImageRect(0, 10), /화소/);
});

test('흰색·투명한 빈 이미지와 실제 서명 픽셀을 구별한다', () => {
  assert.equal(hasSignatureInk([255,255,255,255, 0,0,0,0]), false);
  assert.equal(hasSignatureInk([25,25,25,255]), true);
});

test('파일을 디코딩하기 전에 빈 파일과 5MB 초과 파일을 거부한다', async () => {
  await assert.rejects(normalizeSignatureImage({ size: 0 }), /비어/);
  await assert.rejects(normalizeSignatureImage({ size: MAX_SIGNATURE_FILE_BYTES + 1 }), /5MB/);
});
