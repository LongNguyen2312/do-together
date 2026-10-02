import type { ApiError } from '@/types/api';
import { API_BASE_URL } from '@/utils/constants';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `Request failed with status ${response.status}`,
      status: response.status,
    };
    throw error;
  }

  return response.json() as Promise<T>;
}
