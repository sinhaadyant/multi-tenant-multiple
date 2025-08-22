import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Simple store without TypeScript for now
export const store = configureStore({
  reducer: {
    // We'll add reducers as needed
    auth: (state = { isAuthenticated: false, user: null, error: null }, action) => {
      switch (action.type) {
        case 'auth/loginSuccess':
          return {
            ...state,
            isAuthenticated: true,
            user: action.payload.user,
            error: null
          };
        case 'auth/logout':
          return {
            isAuthenticated: false,
            user: null,
            error: null
          };
        case 'auth/setError':
          return {
            ...state,
            error: action.payload
          };
        default:
          return state;
      }
    }
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

// Action creators
export const loginSuccess = (payload) => ({
  type: 'auth/loginSuccess',
  payload
});

export const logout = () => ({
  type: 'auth/logout'
});

export const setError = (error) => ({
  type: 'auth/setError',
  payload: error
});
