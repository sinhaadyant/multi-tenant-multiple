import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "../../types/auth";
import { RootState } from "../store";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3000/api/auth",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.tokens?.accessToken;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      // Set tenant header if available
      if (state.auth.tenant?.id) {
        headers.set("X-Tenant-ID", state.auth.tenant.id);
      }

      return headers;
    },
  }),
  tagTypes: ["Auth", "Profile"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "Profile"],
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "Profile"],
    }),
    refreshToken: builder.mutation<{ tokens: any }, { refreshToken: string }>({
      query: ({ refreshToken }) => ({
        url: "/refresh",
        method: "POST",
        body: { refreshToken },
      }),
    }),
    getProfile: builder.query<{ user: any; tenant: any }, void>({
      query: () => "/profile",
      providesTags: ["Profile"],
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: ({ email }) => ({
        url: "/forgot-password",
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation<
      { message: string },
      { token: string; password: string }
    >({
      query: ({ token, password }) => ({
        url: "/reset-password",
        method: "POST",
        body: { token, password },
      }),
    }),
    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: ({ currentPassword, newPassword }) => ({
        url: "/change-password",
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    }),
    createInvitation: builder.mutation<
      { message: string },
      { email: string; roleId: string }
    >({
      query: ({ email, roleId }) => ({
        url: "/invite",
        method: "POST",
        body: { email, roleId },
      }),
    }),
    acceptInvitation: builder.mutation<
      RegisterResponse,
      { token: string; password: string; firstName?: string; lastName?: string }
    >({
      query: ({ token, password, firstName, lastName }) => ({
        url: "/accept-invitation",
        method: "POST",
        body: { token, password, firstName, lastName },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetProfileQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useCreateInvitationMutation,
  useAcceptInvitationMutation,
} = authApi;
