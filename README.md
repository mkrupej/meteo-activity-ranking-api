# Activity Ranking API tests

Specification-first API tests using TypeScript and Cucumber. No API implementation is included. The suite contains 9 scenario definitions, expanded into 33 examples.

## Assumptions

These are proposed decisions for this exercise, not a complete specification supplied by the ticket.

- `GET /locations?name=London` accepts full or partial names and returns `{ locations: [{ id, name, country, region }] }`. IDs are strings; `region` is optional. No matches returns HTTP 200 with an empty list.
- `GET /activity-rankings?locationId=1001` returns `{ location: { id, timezone }, days: [{ date, activities: [{ name, suitability, reasoning }] }] }`.
- Forecasts cover today and the following six days in the selected location's timezone. Dates use `YYYY-MM-DD` and are returned chronologically.
- Each day contains all four activities exactly once, ordered by `High`, `Medium`, then `Low`. Ties use: Skiing, Surfing, Outdoor Sightseeing, Indoor Sightseeing.
- Every activity has non-empty English reasoning. Tests check expected text fragments, ignoring case and repeated whitespace.

### Weather rules

Temperature is the daily maximum in Celsius, precipitation the daily total in mm, snowfall the daily total in cm, and wind the daily maximum in km/h.

| Activity | High (all conditions) | Low (any condition) |
| --- | --- | --- |
| Outdoor Sightseeing | Temperature 15-25 inclusive, precipitation 0, wind below 20 | Temperature below 5 or above 35, precipitation at least 10, wind at least 40 |
| Skiing | Temperature at most 0, snowfall 2-10 inclusive, wind below 20 | Temperature above 5, wind at least 40 |
| Surfing | Temperature 18-30 inclusive, precipitation below 1, wind below 20 | Temperature below 10, precipitation at least 10, wind at least 40 |

Other complete conditions give `Medium`. Indoor Sightseeing reverses the Outdoor Sightseeing rating: High becomes Low, Low becomes High, and Medium stays Medium.

### Errors

Error responses contain `{ error: { code, message } }` and no `days` field.

| Case | HTTP status | Code |
| --- | --- | --- |
| Missing or blank location name | 400 | INVALID_LOCATION_NAME |
| Missing or empty location ID | 400 | INVALID_LOCATION_ID |
| Unknown location ID (provider 400 translated to API 404) | 404 | LOCATION_NOT_FOUND |
| Incomplete forecast | 502 | INCOMPLETE_FORECAST |
| Provider HTTP 500 or timeout | 503 | WEATHER_UNAVAILABLE |

## Implementation and running

Requires Node.js 24+ and npm.

```powershell
npm ci
npm run typecheck
npm test -- --dry-run
npm test
```

Tests will fail with Err connection refused error

Tests call `http://127.0.0.1:3000`. To override it in PowerShell:

```powershell
$env:SUT_BASE_URL = 'http://127.0.0.1:4000'
npm test
```

Each example starts and stops a local Open-Meteo HTTP stub on `http://127.0.0.1:3001`. No live provider is called. Run sequentially, keep port 3001 free and disable API caching.

Forecast requests must include the selected coordinates, explicit timezone, `start_date`, `end_date`, and daily fields `temperature_2m_max`, `precipitation_sum`, `snowfall_sum`, `wind_speed_10m_max`. The stub also supports `/v1/search` and `/v1/get`