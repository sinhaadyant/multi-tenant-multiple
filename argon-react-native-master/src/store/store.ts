import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "auth/loginUser/pending",
          "auth/loginUser/fulfilled",
          "auth/loginUser/rejected",
          "auth/logoutUser/pending",
          "auth/logoutUser/fulfilled",
          "auth/logoutUser/rejected",
          "auth/loadStoredAuth/pending",
          "auth/loadStoredAuth/fulfilled",
          "auth/loadStoredAuth/rejected",
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
