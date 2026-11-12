Feature: Daily activity rankings

  Scenario: Rank activities for seven days of warm and dry weather
    Given a valid selected location
    And the weather provider returns a seven-day forecast starting today in the location's timezone
    And all seven days have identical weather conditions:
      | maximum temperature | 22°C    |
      | precipitation       | 0 mm    |
      | snowfall            | 0 cm    |
      | maximum wind speed  | 10 km/h |
    When I request activity rankings for that location
    Then the API responds with status 200
    And the response contains a complete seven-day ranking for the selected location
    And the weather provider is queried for that location and date range
    And each day contains exactly these activities in this order:
      | activity            | suitability |
      | Surfing             | High        |
      | Outdoor Sightseeing | High        |
      | Skiing              | Low         |
      | Indoor Sightseeing  | Low         |
    And each activity's reasoning includes:
      | activity            | reason                                                          |
      | Surfing             | Temperature of 22°C, no precipitation and light wind              |
      | Outdoor Sightseeing | Temperature of 22°C, no precipitation and light wind              |
      | Skiing              | Temperature of 22°C exceeds 5°C                                 |
      | Indoor Sightseeing  | Temperature of 22°C favours outdoor sightseeing                   |

  Scenario: Rank each day using its own weather forecast
    Given a valid selected location
    And the weather provider returns a seven-day forecast starting today in the location's timezone
    And the forecast contains:
      | day | maximum temperature | precipitation | snowfall | maximum wind speed |
      | 1   | 22°C                | 0 mm          | 0 cm     | 10 km/h            |
      | 2   | -3°C                | 5 mm          | 5 cm     | 10 km/h            |
      | 3   | 12°C                | 0 mm          | 0 cm     | 10 km/h            |
      | 4   | 22°C                | 12 mm         | 0 cm     | 10 km/h            |
      | 5   | 22°C                | 0 mm          | 0 cm     | 40 km/h            |
      | 6   | 5°C                 | 0 mm          | 0 cm     | 10 km/h            |
      | 7   | 30°C                | 0 mm          | 0 cm     | 10 km/h            |
    When I request activity rankings for that location
    Then the API responds with status 200
    And the response contains a complete seven-day ranking for the selected location
    And the weather provider is queried for that location and date range
    And the activities for each forecast date appear in this order:
      | day | first              | second              | third              | fourth              |
      | 1   | Surfing            | Outdoor Sightseeing | Skiing             | Indoor Sightseeing  |
      | 2   | Skiing             | Indoor Sightseeing  | Surfing            | Outdoor Sightseeing |
      | 3   | Surfing            | Outdoor Sightseeing | Indoor Sightseeing | Skiing              |
      | 4   | Indoor Sightseeing | Skiing              | Surfing            | Outdoor Sightseeing |
      | 5   | Indoor Sightseeing | Skiing              | Surfing            | Outdoor Sightseeing |
      | 6   | Skiing             | Outdoor Sightseeing | Indoor Sightseeing | Surfing             |
      | 7   | Surfing            | Outdoor Sightseeing | Indoor Sightseeing | Skiing              |
    And the suitability levels in that order are:
      | day | first  | second | third  | fourth |
      | 1   | High   | High   | Low    | Low    |
      | 2   | High   | High   | Low    | Low    |
      | 3   | Medium | Medium | Medium | Low    |
      | 4   | High   | Low    | Low    | Low    |
      | 5   | High   | Low    | Low    | Low    |
      | 6   | Medium | Medium | Medium | Low    |
      | 7   | High   | Medium | Medium | Low    |
    And the reasoning for each forecast date includes:
      | day | activity            | reason                                               |
      | 1   | Outdoor Sightseeing | Temperature of 22°C, no precipitation and light wind |
      | 2   | Skiing              | Temperature of -3°C and snowfall of 5 cm             |
      | 3   | Surfing             | Temperature of 12°C is below 18°C                    |
      | 4   | Indoor Sightseeing  | Precipitation of 12 mm favours indoor sightseeing    |
      | 5   | Outdoor Sightseeing | Wind of 40 km/h is too strong                        |
      | 6   | Skiing              | Temperature of 5°C is above 0°C                      |
      | 7   | Surfing             | Temperature of 30°C, no precipitation and light wind |