import { Given, Then, When, type DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  assertActivityOrder,
  assertForecastRequest,
  assertReasoningIncludes,
  readRankings,
} from '../../tests/assertions/rankings';
import type { WeatherConditions } from '../../tests/fixtures/weather';
import {
  TEST_LOCATION,
  createForecast,
  createForecastDates,
} from '../../tests/fixtures/weather';
import type { TestWorld } from '../support/world';

Given('a valid selected location', function (this: TestWorld) {
  this.selectedLocationId = TEST_LOCATION.id;
  this.openMeteoStub.setLocation(TEST_LOCATION);
});

Given(
  "the weather provider returns a seven-day forecast starting today in the location's timezone",
  prepareForecast,
);

Given(
  'all seven days have identical weather conditions:',
  function (this: TestWorld, table: DataTable) {
    const weather = readWeather(table.rowsHash());

    this.forecast = createForecast(this.forecastDates, Array(7).fill(weather));

    this.openMeteoStub.setForecast(this.forecast);
  },
);

When(
  'I request activity rankings for that location',
  async function (this: TestWorld) {
    assert.ok(this.selectedLocationId, 'Expected a selected location ID');

    this.response = await this.api.getActivityRankings(this.selectedLocationId);
  },
);

Then(
  'the response contains a complete seven-day ranking for the selected location',
  async function (this: TestWorld) {
    const { location, days } = await readRankings(this.response);

    assert.equal(
      location.id,
      this.selectedLocationId,
      'Incorrect selected location',
    );

    assert.equal(
      location.timezone,
      TEST_LOCATION.timezone,
      'Incorrect location timezone',
    );

    assert.equal(this.forecastDates.length, 7, 'Expected seven fixture dates');

    assert.deepEqual(
      days.map((day) => day.date),
      this.forecastDates,
      'Incorrect forecast dates or order',
    );

    assertActivityOrder(days);
  },
);

Then(
  'the weather provider is queried for that location and date range',
  function (this: TestWorld) {
    assertForecastRequest(
      this.openMeteoStub.forecastRequests,
      this.forecastDates,
    );
  },
);

Then(
  'each day contains exactly these activities in this order:',
  async function (this: TestWorld, table: DataTable) {
    const expected = table.hashes();
    const { days } = await readRankings(this.response);

    for (const day of days) {
      const actual = day.activities.map((activity) => ({
        activity: activity.name,
        suitability: activity.suitability,
      }));

      assert.deepEqual(
        actual,
        expected,
        `Incorrect activities or suitability on ${day.date}`,
      );
    }
  },
);

Then(
  "each activity's reasoning includes:",
  async function (this: TestWorld, table: DataTable) {
    const { days } = await readRankings(this.response);

    for (const row of table.hashes()) {
      const { activity, reason } = row;

      assert.ok(activity, 'Expected an activity name in the table');
      assert.ok(
        typeof reason === 'string' && reason.trim(),
        'Expected a non-empty reason in the table',
      );

      for (const day of days) {
        const ranking = day.activities.find((item) => item.name === activity);

        assert.ok(ranking, `Missing ${activity} on ${day.date}`);

        assertReasoningIncludes(
          ranking.reasoning,
          reason,
          `${day.date}: ${activity}`,
        );
      }
    }
  },
);

function prepareForecast(this: TestWorld): void {
  this.forecastDates = createForecastDates(TEST_LOCATION.timezone);

  const weather = {
    temperature: 22,
    precipitation: 0,
    snowfall: 0,
    wind: 10,
  };

  this.forecast = createForecast(this.forecastDates, Array(7).fill(weather));

  this.openMeteoStub.setForecast(this.forecast);
}

function readWeather(row: Record<string, string>): WeatherConditions {
  const readNumber = (field: string): number => {
    const text = row[field];
    assert.ok(typeof text === 'string', `Missing fixture field "${field}"`);

    const value = Number.parseFloat(text);
    assert.ok(Number.isFinite(value), `Invalid fixture value for "${field}"`);

    return value;
  };

  return {
    temperature: readNumber('maximum temperature'),
    precipitation: readNumber('precipitation'),
    snowfall: readNumber('snowfall'),
    wind: readNumber('maximum wind speed'),
  };
}
