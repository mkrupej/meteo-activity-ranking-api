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