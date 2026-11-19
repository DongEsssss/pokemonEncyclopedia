import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calculateDamage,
  moveHits,
  nextTeamMemberIndex,
  residualHp,
} from '../src/utils/battleRules.ts';

test('accuracy rolls distinguish hits from misses at the threshold', () => {
  assert.equal(moveHits(80, 0.799), true);
  assert.equal(moveHits(80, 0.8), false);
  assert.equal(moveHits(0, 0), false);
  assert.equal(moveHits(100, 0.999), true);
  assert.equal(moveHits(null, 0.999), true);
});

test('type immunity deals zero damage even with STAB', () => {
  assert.equal(calculateDamage(80, 100, 100, 0, true), 0);
  assert.equal(calculateDamage(1, 10, 100, 0.5), 1);
});

test('burn reduces physical damage and preserves special damage', () => {
  assert.equal(calculateDamage(80, 100, 100, 1, true, 'BRN', true), 30);
  assert.equal(calculateDamage(80, 100, 100, 1, true, 'BRN', false), 60);
});

test('residual effects accumulate and HP never falls below zero', () => {
  const afterPoison = residualHp(100, 160, 1 / 8);
  assert.equal(afterPoison, 80);
  assert.equal(residualHp(afterPoison, 160, 1 / 4), 40);
  assert.equal(residualHp(1, 8, 1 / 16), 0);
});

test('a fainted lead has a replacement only while a teammate remains', () => {
  assert.equal(nextTeamMemberIndex(0, 2), 1);
  assert.equal(nextTeamMemberIndex(1, 2), null);
  assert.equal(nextTeamMemberIndex(0, 1), null);
});
