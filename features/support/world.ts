import { World, setWorldConstructor } from '@cucumber/cucumber';
import { ActivityApiClient } from '../../tests/client/activity-api.client';
import type { OpenMeteoForecast } from '../../tests/fixtures/weather';
import { OpenMeteoStub } from '../../tests/stubs/open-meteo.stub';

export class TestWorld extends World {
  api = new ActivityApiClient();
  openMeteoStub = new OpenMeteoStub();

  response?: Response;
  selectedLocationId?: string;
  forecastDates: string[] = [];
  forecast?: OpenMeteoForecast;
}

setWorldConstructor(TestWorld);
