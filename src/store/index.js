import { configureStore } from '@reduxjs/toolkit';
import commissionReducer from './commissionSlice';

export const store = configureStore({
  reducer: {
    commission: commissionReducer,
  },
});

export default store;