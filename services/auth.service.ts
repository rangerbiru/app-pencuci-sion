import { api, unwrapData } from './api/api';
import { http } from './api/http';
import { LoginResponse, Me, Meta } from '@/types';

export const authApi = api.injectEndpoints({
  endpoints: build => ({
    getMe: build.query<Me, void>({
      query: () => ({ path: '/me' }),
      transformResponse: unwrapData<Me>,
      providesTags: ['Me'],
    }),
    changePassword: build.mutation<
      unknown,
      { current_password: string; password: string; password_confirmation: string }
    >({
      query: body => ({ path: '/me/password', method: 'POST', body }),
    }),
  }),
});

export const { useGetMeQuery, useChangePasswordMutation } = authApi;

/** Login di luar RTK Query karena hasilnya langsung disimpan ke SecureStore. */
export function login(identifier: string, password: string, deviceName: string) {
  return http<{ data: LoginResponse }>({
    path: '/auth/login',
    method: 'POST',
    auth: false,
    body: { identifier, password, device_name: deviceName },
  });
}

export function logout() {
  return http<unknown>({ path: '/auth/logout', method: 'POST', timeoutMs: 8000 });
}

export function fetchMe() {
  return http<{ data: Me }>({ path: '/me' });
}

export function fetchMeta() {
  return http<{ data: Meta }>({ path: '/meta', auth: false, timeoutMs: 8000 });
}
