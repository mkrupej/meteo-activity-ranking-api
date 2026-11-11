import { Given, Then, When, type DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { Location } from '../../tests/client/activity-api.client';
import type { TestWorld } from '../support/world';

Given(
  'the location providers returns the following for {string}:',
  function (this: TestWorld, name: string, table: DataTable) {
    this.openMeteoStub.setLocationMatches(name, readLocationTable(table));
  },
);

Given(
  'the location provider returns no matches for {string}',
  function (this: TestWorld, name: string) {
    this.openMeteoStub.setLocationMatches(name, []);
  },
);

When(
  'I search for locations using {string}',
  async function (this: TestWorld, name: string) {
    this.response = await this.api.searchLocations(name);
  },
);

Then('the location provider is queried', function (this: TestWorld) {
  assert.ok(
    this.openMeteoStub.locationRequests > 0,
    'The configured location provider was not queried',
  );
});

Then(
  'I should see the following locations:',
  async function (this: TestWorld, table: DataTable) {
    const locations = await readLocations(this);
    const actual = locations.sort((a, b) => a.id.localeCompare(b.id));

    const expected = readLocationTable(table).sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    assert.deepEqual(actual, expected);
  },
);

Then(
  'the response contains an empty list of locations',
  async function (this: TestWorld) {
    const locations = await readLocations(this);
    assert.deepEqual(locations, []);
  },
);

function readLocationTable(table: DataTable): Location[] {
  return table.hashes().map(({ id, name, country, region }) => {
    assert.ok(
      typeof id === 'string',
      'Expected a location ID in the data table',
    );
    assert.ok(
      typeof name === 'string',
      'Expected a location name in the data table',
    );
    assert.ok(
      typeof country === 'string',
      'Expected a location country in the data table',
    );
    return { id, name, country, region };
  });
}

async function readLocations(world: TestWorld): Promise<Location[]> {
  assert.ok(world.response, 'No API response was received');

  const body: unknown = await world.response.json();

  assert.ok(
    typeof body === 'object' && body !== null && !Array.isArray(body),
    'Expected a JSON object',
  );

  assert.ok(
    'locations' in body && Array.isArray(body.locations),
    'Expected a locations array',
  );

  return body.locations.map((location: unknown) => {
    assert.ok(
      typeof location === 'object' &&
        location !== null &&
        !Array.isArray(location),
      'Expected a location object',
    );

    assert.ok(
      'id' in location && typeof location.id === 'string',
      'Expected a string location ID',
    );

    assert.ok(
      'name' in location && typeof location.name === 'string',
      'Expected a string location name',
    );

    assert.ok(
      'country' in location && typeof location.country === 'string',
      'Expected a string location country',
    );

    const region = 'region' in location ? location.region : undefined;

    assert.ok(
      region === undefined || typeof region === 'string',
      'Expected a string location region when present',
    );

    return {
      id: location.id,
      name: location.name,
      country: location.country,
      region,
    };
  });
}
