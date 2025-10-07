import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminReducer from "../features/admin/adminSlice";
import dashboardReducer from "../features/admin/dashboardSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        dashboard: dashboardReducer,
    },

    devTools: import.meta.env.MODE !== "production",

 });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;