import assert from 'node:assert/strict';
import { TEST_LOCATION } from '../fixtures/weather';

export const ACTIVITY_NAMES = [
  'Skiing',
  'Surfing',
  'Outdoor Sightseeing',
  'Indoor Sightseeing',
] as const;

export type ActivityName = (typeof ACTIVITY_NAMES)[number];

export type ActivityRanking = {
  name: ActivityName;
  suitability: 'High' | 'Medium' | 'Low';
  reasoning: string;
};

export type DayRanking = {
  date: string;
  activities: ActivityRanking[];
};

export type RankingResponse = {
  location: {
    id: string;
    timezone: string;
  };
  days: DayRanking[];
};

export async function readRankings(
  response: Response | undefined,
): Promise<RankingResponse> {
  assert.ok(response, 'No API response was received');

  const body: unknown = await response.clone().json();

  assert.ok(
    typeof body === 'object' && body !== null && !Array.isArray(body),
    'Expected a JSON object',
  );

  assert.ok('location' in body, 'Expected a location object');

  assert.ok(
    'days' in body && Array.isArray(body.days),
    'Expected a days array',
  );

  return {
    location: readLocation(body.location),
    days: body.days.map(readDay),
  };
}

function readLocation(value: unknown): RankingResponse['location'] {
  assert.ok(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    'Expected a location object',
  );

  assert.ok(
    'id' in value && typeof value.id === 'string',
    'Expected a string location ID',
  );

  assert.ok(
    'timezone' in value && typeof value.timezone === 'string',
    'Expected a timezone',
  );

  return {
    id: value.id,
    timezone: value.timezone,
  };
}

function readDay(value: unknown): DayRanking {
  assert.ok(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    'Expected a day object',
  );

  assert.ok(
    'date' in value && typeof value.date === 'string',
    'Expected a date string',
  );

  assert.ok(
    'activities' in value && Array.isArray(value.activities),
    'Expected an activities array',
  );

  return {
    date: value.date,
    activities: value.activities.map(readActivity),
  };
}

function readActivity(value: unknown): ActivityRanking {
  assert.ok(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    'Expected an activity object',
  );

  assert.ok(
    'name' in value && isActivityName(value.name),
    'Expected a supported activity name',
  );

  assert.ok(
    'suitability' in value &&
      (value.suitability === 'High' ||
        value.suitability === 'Medium' ||
        value.suitability === 'Low'),
    'Expected High, Medium or Low suitability',
  );

  assert.ok(
    'reasoning' in value && typeof value.reasoning === 'string',
    'Expected reasoning text',
  );

  assert.ok(value.reasoning.trim(), `Missing reasoning for ${value.name}`);

  return {
    name: value.name,
    suitability: value.suitability,
    reasoning: value.reasoning,
  };
}

function isActivityName(value: unknown): value is ActivityName {
  return ACTIVITY_NAMES.some((name) => name === value);
}

export function assertActivityOrder(days: DayRanking[]): void {
  const suitabilityOrder = { High: 0, Medium: 1, Low: 2 };

  for (const day of days) {
    assert.deepEqual(
      day.activities.map((activity) => activity.name).sort(),
      [...ACTIVITY_NAMES].sort(),
      `Expected each of the four activities exactly once on ${day.date}`,
    );

    const sorted = [...day.activities].sort(
      (a, b) =>
        suitabilityOrder[a.suitability] - suitabilityOrder[b.suitability] ||
        ACTIVITY_NAMES.indexOf(a.name) - ACTIVITY_NAMES.indexOf(b.name),
    );

    assert.deepEqual(
      day.activities,
      sorted,
      `Incorrect ranking order on ${day.date}`,
    );
  }
}

export function assertForecastRequest(requests: URL[], dates: string[]): void {
  assert.ok(requests.length > 0, 'The weather provider was not queried');
  assert.equal(dates.length, 7, 'Expected seven forecast dates');

  const startDate = dates[0];
  const endDate = dates[6];

  assert.ok(startDate && endDate, 'Expected the first and last forecast dates');

  const expectedFields = [
    'temperature_2m_max',
    'precipitation_sum',
    'snowfall_sum',
    'wind_speed_10m_max',
  ];

  for (const request of requests) {
    const params = request.searchParams;

    assert.equal(params.get('latitude'), String(TEST_LOCATION.latitude));
    assert.equal(params.get('longitude'), String(TEST_LOCATION.longitude));
    assert.equal(params.get('timezone'), TEST_LOCATION.timezone);
    assert.equal(params.get('start_date'), startDate);
    assert.equal(params.get('end_date'), endDate);

    assert.equal(params.get('temperature_unit') ?? 'celsius', 'celsius');
    assert.equal(params.get('precipitation_unit') ?? 'mm', 'mm');
    assert.equal(params.get('wind_speed_unit') ?? 'kmh', 'kmh');

    const fields = (params.get('daily') ?? '').split(',');

    for (const field of expectedFields) {
      assert.ok(
        fields.includes(field),
        `Missing requested weather field: ${field}`,
      );
    }
  }
}

export function assertReasoningIncludes(
  actual: string,
  expected: string,
  context: string,
): void {
  const normalise = (text: string): string =>
    text.toLowerCase().replace(/\s+/g, ' ').trim();

  assert.ok(
    normalise(actual).includes(normalise(expected)),
    `${context}: expected reasoning to include "${expected}", received "${actual}"`,
  );
}
