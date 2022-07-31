import { buildURL } from './utils';

export async function clientFetch(...args: Parameters<typeof fetch>) {
  return fetch(...args)
    .then((response) => {
      if (!response.ok) {
        throw response;
      }
      return response;
    })
    .then((response) => response.json());
}

function defaultRequest(fetcher: (...args: Parameters<typeof fetch>) => Promise<any>) {
  return {
    get: <T>(endpoint: string, init?: Omit<FetchInitRequest, 'body'>): Promise<T> =>
      fetcher(buildURL(endpoint, init?.query), init),
    post: <T>(endpoint: string, body?: any, init?: Omit<FetchInitRequest, 'body'>): Promise<T> =>
      fetcher(buildURL(endpoint, init?.query), { ...init, body, method: 'POST' }),
    put: <T>(endpoint: string, body?: any, init?: Omit<FetchInitRequest, 'body'>): Promise<T> =>
      fetcher(buildURL(endpoint, init?.query), { ...init, body, method: 'PUT' }),
    delete: <T>(endpoint: string, body?: any, init?: Omit<FetchInitRequest, 'body'>): Promise<T> =>
      fetcher(buildURL(endpoint, init?.query), { ...init, body, method: 'DELETE' })
  };
}

export const Request = defaultRequest(clientFetch);
