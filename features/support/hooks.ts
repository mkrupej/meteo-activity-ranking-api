import { After, Before } from '@cucumber/cucumber';
import type { TestWorld } from './world';

Before(async function (this: TestWorld) {
  await this.openMeteoStub.start();
});

After(async function (this: TestWorld) {
  await this.openMeteoStub.stop();
});
