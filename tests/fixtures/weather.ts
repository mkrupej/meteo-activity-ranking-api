import assert from 'node:assert/strict';

export const TEST_LOCATION = {
  id: '1001',
  name: 'London',
  country: 'United Kingdom',
  region: 'England',
  latitude: 51.5085,
  longitude: -0.1257,
  timezone: 'Europe/London',
};

export type WeatherConditions = {
  temperature: number;
  precipitation: number;
  snowfall: number;
  wind: number;
};

export type OpenMeteoForecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  daily_units: {
    time: string;
    temperature_2m_max: string;
    precipitation_sum: string;
    snowfall_sum: string;
    wind_speed_10m_max: string;
  };
  daily: {
    time: string[]; // [0]first day date
    temperature_2m_max?: (number | null)[]; //[0] first day temperature
    precipitation_sum: number[]; //[0] first day precipitation
    snowfall_sum: number[]; // [0] first day snowfall
    wind_speed_10m_max: number[]; // [0] first day wind speed
  };
};

export function createForecastDates(timezone: string): string[] {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const { year, month, day } = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  assert.ok(year && month && day, 'Expected a complete local calendar date');

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day) + index),
    );

    return date.toISOString().slice(0, 10);
  });
}

export function createForecast(
  dates: string[],
  conditions: WeatherConditions[],
): OpenMeteoForecast {
  if (dates.length !== conditions.length) {
    throw new Error('Each forecast date must have its own weather conditions');
  }

  return {
    latitude: TEST_LOCATION.latitude,
    longitude: TEST_LOCATION.longitude,
    timezone: TEST_LOCATION.timezone,
    daily_units: {
      time: 'iso8601',
      temperature_2m_max: '°C',
      precipitation_sum: 'mm',
      snowfall_sum: 'cm',
      wind_speed_10m_max: 'km/h',
    },
    daily: {
      time: [...dates],
      temperature_2m_max: conditions.map((day) => day.temperature),
      precipitation_sum: conditions.map((day) => day.precipitation),
      snowfall_sum: conditions.map((day) => day.snowfall),
      wind_speed_10m_max: conditions.map((day) => day.wind),
    },
  };
}
