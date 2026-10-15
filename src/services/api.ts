import axios, { isAxiosError } from 'axios';

import type { ApiError } from '@/types/api';
import { API_BASE_URL } from '@/utils/constants';

/** How long any request may take before it counts as failed. */
const TIMEOUT_MS = 10000;

/**
 * Every HTTP request the app makes goes through axios: `http` for outside
 * services by full URL (the provinces API, the music on R2), `api` for the
 * app's own backend.
 */
export const http = axios.create({ timeout: TIMEOUT_MS });

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/** An axios failure as the app's error: what went wrong and the status, if any. */
export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    return {
      message: error.response
        ? `Request failed with status ${error.response.status}`
        : error.message,
      status: error.response?.status,
    };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

api.interceptors.response.use(undefined, error =>
  Promise.reject(toApiError(error)),
);

/** A call to the app's backend, its JSON body back. */
export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const response = await api.request<T>({
    url: endpoint,
    method: options.method ?? 'GET',
    data: options.body,
    headers: options.headers,
  });
  return response.data;
}
