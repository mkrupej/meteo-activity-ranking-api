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

Scenario Outline: Assess activity suitability using the agreed weather rules
    Given a valid selected location
    And the weather provider returns a seven-day forecast starting today in the location's timezone
    And all seven days have identical weather conditions:
      | maximum temperature | <temperature>   |
      | precipitation       | <precipitation> |
      | snowfall            | <snowfall>      |
      | maximum wind speed  | <wind>          |
    When I request activity rankings for that location
    Then the API responds with status 200
    And the response contains a complete seven-day ranking for the selected location
    And the weather provider is queried for that location and date range
    And "<activity>" has suitability "<suitability>" on every day
    And the reasoning for "<activity>" includes "<reason>"

    Examples:
      | activity            | temperature | precipitation | snowfall | wind    | suitability | reason                                               |
      | Outdoor Sightseeing | 15°C        | 0 mm          | 0 cm     | 10 km/h | High        | Temperature of 15°C, no precipitation and light wind |
      | Outdoor Sightseeing | 14.9°C      | 0 mm          | 0 cm     | 10 km/h | Medium      | Temperature of 14.9°C is below 15°C                  |
      | Outdoor Sightseeing | 22°C        | 9.9 mm        | 0 cm     | 10 km/h | Medium      | Precipitation of 9.9 mm reduces outdoor suitability |
      | Outdoor Sightseeing | 22°C        | 10 mm         | 0 cm     | 10 km/h | Low         | Precipitation of 10 mm is too heavy                 |
      | Skiing              | 0°C         | 2 mm          | 2 cm     | 10 km/h | High        | Temperature of 0°C and snowfall of 2 cm             |
      | Skiing              | 0°C         | 1.9 mm        | 1.9 cm   | 10 km/h | Medium      | Snowfall of 1.9 cm is below 2 cm                    |
      | Skiing              | 5°C         | 0 mm          | 0 cm     | 10 km/h | Medium      | Temperature of 5°C is above 0°C                     |
      | Skiing              | 5.1°C       | 0 mm          | 0 cm     | 10 km/h | Low         | Temperature of 5.1°C exceeds 5°C                    |
      | Surfing            | 18°C   | 0 mm   | 0 cm | 10 km/h | High   | Temperature of 18°C, no precipitation and light wind |
      | Surfing            | 17.9°C | 0 mm   | 0 cm | 10 km/h | Medium | Temperature of 17.9°C is below 18°C                  |
      | Surfing            | 22°C   | 0.9 mm | 0 cm | 10 km/h | High   | Precipitation of 0.9 mm is below 1 mm                |
      | Surfing            | 22°C   | 1 mm   | 0 cm | 10 km/h | Medium | Precipitation of 1 mm reduces surfing suitability    |
      | Surfing            | 9.9°C  | 0 mm   | 0 cm | 10 km/h | Low    | Temperature of 9.9°C is below 10°C                   |
      | Indoor Sightseeing | 22°C   | 0 mm   | 0 cm | 10 km/h | Low    | Temperature of 22°C favours outdoor sightseeing      |
      | Indoor Sightseeing | 12°C   | 0 mm   | 0 cm | 10 km/h | Medium | Moderate outdoor conditions at 12°C                  |
      | Indoor Sightseeing | 22°C   | 10 mm  | 0 cm | 10 km/h | High   | Precipitation of 10 mm favours indoor sightseeing    |

  Scenario Outline: Reject a ranking request without a recognised location
    Given location identifier "9999" does not identify an existing location
    When I send a GET request to "<path>"
    Then the API responds with status <status>
    And the error code is "<errorCode>"
    And the unknown location is looked up: <lookup>
    And no weather forecast is requested

    Examples:
      | path                              | status | errorCode           | lookup |
      | /activity-rankings                | 400    | INVALID_LOCATION_ID | no     |
      | /activity-rankings?locationId=     | 400    | INVALID_LOCATION_ID | no     |
      | /activity-rankings?locationId=9999 | 404    | LOCATION_NOT_FOUND  | yes    |

  Scenario Outline: Reject an incomplete weather forecast
    Given a valid selected location
    And the weather provider returns a seven-day forecast starting today in the location's timezone
    But the forecast has this problem: "<problem>"
    When I request activity rankings for that location
    Then the API responds with status 502
    And the error code is "INCOMPLETE_FORECAST"
    And the weather provider is queried
    And the error message explains that the forecast is incomplete
    And the response contains no activity rankings

    Examples:
      | problem                                                |
      | the final required day is missing                       |
      | one required date is replaced by a duplicate of another |
      | maximum temperature is missing for one day              |
      | maximum temperature is null for one day                 |

  Scenario Outline: Report an unavailable weather forecast
    Given a valid selected location
    And the weather provider <failure>
    When I request activity rankings for that location
    Then the API responds with status 503
    And the error code is "WEATHER_UNAVAILABLE"
    And the weather provider is queried
    And the error message explains that the forecast is temporarily unavailable
    And the response contains no activity rankings

    Examples:
      | failure                                                |
      | returns HTTP 500                                        |
      | does not respond before the configured provider timeout |