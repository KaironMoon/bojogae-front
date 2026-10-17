import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const { outputFiles } = buildSync({ entryPoints: [fileURLToPath(new URL('../src/pages/claims/SignaturePad.jsx', import.meta.url))],
  bundle: true, packages: 'external', platform: 'node', format: 'cjs', jsx: 'automatic', write: false });
const compiled = { exports: {} };
new Function('require', 'module', 'exports', outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);

test('서명 캔버스의 실제 그리기 버퍼 크기가 HTML 속성으로 전달된다', () => {
  const html = renderToStaticMarkup(React.createElement(compiled.exports.default, {
    label: '피보험자 서명', value: '', onChange: () => {}, disabled: false,
  }));
  const canvas = html.match(/<canvas\b[^>]*>/)?.[0];
  assert.ok(canvas);
  assert.match(canvas, /\bwidth="600"/);
  assert.match(canvas, /\bheight="170"/);
});
