export type Location = {
  id: string;
  name: string;
  country: string;
  region?: string;
};

export class ActivityApiClient {
  constructor(
    private readonly baseUrl = process.env.SUT_BASE_URL ??
      'http://127.0.0.1:3000',
  ) {}

  searchLocations(name: string): Promise<Response> {
    return this.get('/locations?' + new URLSearchParams({ name }));
  }

  getActivityRankings(locationId: string): Promise<Response> {
    return this.get(
      '/activity-rankings?' + new URLSearchParams({ locationId }),
    );
  }

  async get(path: string): Promise<Response> {
    const url = new URL(path, this.baseUrl);

    try {
      return await fetch(url, { signal: AbortSignal.timeout(3000) });
    } catch (cause) {
      throw new Error(
        `GET ${url} failed. Start the API at SUT_BASE_URL and point its Open-Meteo URLs to http://127.0.0.1:3001.`,
        { cause },
      );
    }
  }
}
