import { Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { TestWorld } from '../support/world';

When(
  'I send a GET request to {string}',
  async function (this: TestWorld, path: string) {
    this.response = await this.api.get(path);
  },
);

Then(
  'the API responds with status {int}',
  function (this: TestWorld, status: number) {
    assert.ok(this.response, 'No API response was receiver');
    assert.equal(this.response.status, status);
  },
);

Then('no location lookup is requested', function (this: TestWorld) {
  assert.equal(
    this.openMeteoStub.locationRequests,
    0,
    'No location lookup should be requested',
  );
});

Then(
  'the error code is {string}',
  async function (this: TestWorld, expectedCode: string) {
    const error = await readError(this);
    assert.equal(error.code, expectedCode);
  },
);

async function readError(
  world: TestWorld,
): Promise<{ code: string; message: string }> {
  assert.ok(world.response, 'No API response was received');

  const body: unknown = await world.response.json();

  assert.ok(
    typeof body === 'object' && body !== null && !Array.isArray(body),
    'Expected a JSON object',
  );
  assert.ok('error' in body, 'Expected an error object');

  const error = body.error;

  assert.ok(
    typeof error === 'object' && error !== null && !Array.isArray(error),
    'Expected an error object',
  );
  assert.ok(
    'code' in error && typeof error.code === 'string',
    'Expected a string error code',
  );
  assert.ok(
    'message' in error && typeof error.message === 'string',
    'Expected a string error message',
  );
  assert.ok(
    error.message.trim().length > 0,
    'The error message must not be blank',
  );

  return { code: error.code, message: error.message };
}
