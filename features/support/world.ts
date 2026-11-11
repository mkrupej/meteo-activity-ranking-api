import { World, setWorldConstructor } from '@cucumber/cucumber';
import { ActivityApiClient } from '../../tests/client/activity-api.client';
import { OpenMeteoStub } from '../../tests/stubs/open-meteo.stub';

export class TestWorld extends World {
  api = new ActivityApiClient();
  openMeteoStub = new OpenMeteoStub();

  response?: Response;
}

setWorldConstructor(TestWorld);
