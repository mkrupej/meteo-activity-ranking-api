import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import type { Location } from "../client/activity-api.client";

export class OpenMeteoStub {
  locationRequests = 0;

  private searchName?: string;
  private matches: Location[] = [];

  private readonly server = createServer((request, response) => {
    this.handleRequest(request, response);
  });

  setLocationMatches(name: string, matches: Location[]): void {
    this.searchName = name;
    this.matches = matches;
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(3001, "127.0.0.1", resolve);
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
    const url = new URL(request.url ?? "/", "http://127.0.0.1:3001");

    response.setHeader("Content-Type", "application/json");
    this.recordRequest(url);

    if (request.method !== "GET") {
      this.sendNotFound(response);
      return;
    }

    switch (url.pathname) {
      case "/v1/search":
        this.handleLocationSearch(url, response);
        break;
      default:
        this.sendNotFound(response);
    }
  }

  private recordRequest(url: URL): void {
    if (url.pathname === "/v1/search") {
      this.locationRequests++;
    }
  }

  private handleLocationSearch(url: URL, response: ServerResponse): void {
    if (url.searchParams.get("name") !== this.searchName) {
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

  private sendNotFound(response: ServerResponse): void {
    this.sendJson(response, 404, {
      error: true,
      reason: "No matching stub response",
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
