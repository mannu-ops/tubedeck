import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProgressLine } from '../src/extractor.js';

test('parseProgressLine parses standard English line', () => {
  const line = '[download]  12.3% of ~150.00MiB at 2.40MiB/s ETA 00:10';
  const p = parseProgressLine(line);
  assert.equal(p.progress, 12.3);
  assert.equal(p.speed, '2.40MiB/s');
  assert.equal(p.eta, '00:10');
});

test('parseProgressLine tolerates locale decimal comma', () => {
  const p = parseProgressLine('[download]  12,3% of ~150,00MiB at 2,40MiB/s ETA 00:10');
  assert.equal(p.progress, 12.3);
});

test('parseProgressLine works without ETA', () => {
  const p = parseProgressLine('[download]  50% of 100.00MiB at 1.00MiB/s');
  assert.equal(p.progress, 50);
  assert.equal(p.eta, undefined);
});

test('parseProgressLine caps at 99', () => {
  const p = parseProgressLine('[download]  100% of 10MiB at 1MiB/s ETA 00:00');
  assert.equal(p.progress, 99);
});

test('parseProgressLine returns null for non-progress lines', () => {
  assert.equal(parseProgressLine('some other output'), null);
  assert.equal(parseProgressLine(''), null);
});
