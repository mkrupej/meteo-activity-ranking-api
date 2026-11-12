import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

import type { Location } from '../client/activity-api.client';
import type { OpenMeteoForecast, TEST_LOCATION } from '../fixtures/weather';

export class OpenMeteoStub {
  locationRequests = 0;
  weatherRequests = 0;
  forecastRequests: URL[] = [];

  private searchName?: string;
  private matches: Location[] = [];
  private location?: typeof TEST_LOCATION;
  private weatherStatus = 404;
  private weatherBody: unknown = {
    error: true,
    reason: 'No forecast configured',
  };

  private readonly server = createServer((request, response) => {
    this.handleRequest(request, response);
  });

  setLocationMatches(name: string, matches: Location[]): void {
    this.searchName = name;
    this.matches = matches;
  }

  setLocation(location: typeof TEST_LOCATION): void {
    this.location = location;
  }

  setForecast(forecast: OpenMeteoForecast): void {
    this.weatherStatus = 200;
    this.weatherBody = forecast;
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(3001, '127.0.0.1', resolve);
    });
  }

  async stop(): Promise<void> {
    if (!this.server.listening) return;

    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
      this.server.closeAllConnections();
    });
  }

  private handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): void {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1:3001');

    response.setHeader('Content-Type', 'application/json');
    this.recordRequest(url);

    if (request.method !== 'GET') {
      this.sendNotFound(response);
      return;
    }

    switch (url.pathname) {
      case '/v1/search':
        this.handleLocationSearch(url, response);
        break;
      case '/v1/get':
        this.handleLocationLookup(url, response);
        break;
      case '/v1/forecast':
        this.handleForecast(response);
        break;
      default:
        this.sendNotFound(response);
    }
  }

  private recordRequest(url: URL): void {
    if (url.pathname === '/v1/search' || url.pathname === '/v1/get') {
      this.locationRequests++;
    }

    if (url.pathname === '/v1/forecast') {
      this.weatherRequests++;
      this.forecastRequests.push(url);
    }
  }

  private handleLocationSearch(url: URL, response: ServerResponse): void {
    if (url.searchParams.get('name') !== this.searchName) {
      this.sendNotFound(response);
      return;
    }

    if (this.matches.length === 0) {
      this.sendJson(response, 200, {});
      return;
    }

    const results = this.matches.map((match) => ({
      id: Number(match.id),
      name: match.name,
      country: match.country,
      admin1: match.region,
    }));

    this.sendJson(response, 200, { results });
  }

  private handleLocationLookup(url: URL, response: ServerResponse): void {
    const requestedId = url.searchParams.get('id');

    if (this.location && requestedId === this.location.id) {
      const { id, name, country, region, latitude, longitude, timezone } =
        this.location;

      this.sendJson(response, 200, {
        id: Number(id),
        name,
        country,
        admin1: region,
        latitude,
        longitude,
        timezone,
      });
      return;
    }

    this.sendNotFound(response);
  }

  private handleForecast(response: ServerResponse): void {
    this.sendJson(response, this.weatherStatus, this.weatherBody);
  }

  private sendNotFound(response: ServerResponse): void {
    this.sendJson(response, 404, {
      error: true,
      reason: 'No matching stub response',
    });
  }

  private sendJson(
    response: ServerResponse,
    status: number,
    body: unknown,
  ): void {
    response.writeHead(status);
    response.end(JSON.stringify(body));
  }
}
