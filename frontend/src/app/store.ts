import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminReducer from "../features/admin/adminSlice";
import dashboardReducer from "../features/admin/dashboardSlice";
import mentorReducer from "../features/mentor/mentorSlice";
import studentTrialReducer from "../features/trial/student/studentTrialSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    dashboard: dashboardReducer,
    mentor: mentorReducer,
    studentTrial: studentTrialReducer,
  },

  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
