import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { TestWorld } from '../support/world';

Then(
  'the API responds with status {int}',
  function (this: TestWorld, status: number) {
    assert.ok(this.response, 'No API response was receiver');
    assert.equal(this.response.status, status);
  },
);
