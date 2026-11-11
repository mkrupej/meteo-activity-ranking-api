Feature: Location search

    Scenario Outline: Find locations by a full or partial name
        Given the location providers returns the following for "<name>":
            | id   | name   | country        | region  |
            | 1001 | London | United Kingdom | England |
            | 1002 | London | Canada         | Ontario |
        When I search for locations using "<name>"
        Then the API responds with status 200
        And the location provider is queried
        And I should see the following locations:
            | id   | name   | country        | region  |
            | 1001 | London | United Kingdom | England |
            | 1002 | London | Canada         | Ontario |
            
        Examples:
            | name   |
            | London |
            | Lon    |

    Scenario: No locations match the supplied name
        Given the location provider returns no matches for "UnknownTownXYZ"
        When I search for locations using "UnknownTownXYZ"
        Then the API responds with status 200
        And the location provider is queried
        And the response contains an empty list of locations

    Scenario Outline: Reject a location search with a missing or blank name
        When I send a GET request to "<path>"
        Then the API responds with status 400
        And the error code is "INVALID_LOCATION_NAME"
        And no location lookup is requested

        Examples:
        | path                    |
        | /locations              |
        | /locations?name=        |
        | /locations?name=%20%20   |