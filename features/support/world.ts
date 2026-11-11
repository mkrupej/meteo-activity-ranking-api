import { World, setWorldConstructor } from "@cucumber/cucumber";
import { ActivityApiClient } from "../../tests/client/activity-api.client";

export class TestWorld extends World {
  api = new ActivityApiClient();
  response?: Response;
}

setWorldConstructor(TestWorld);
