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