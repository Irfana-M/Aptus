import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminReducer from "../features/admin/adminSlice";
import dashboardReducer from "../features/admin/dashboardSlice";
import mentorReducer from "../features/mentor/mentorSlice";
import studentTrialReducer from "../features/trial/student/studentTrialSlice";
import videoCallReducer from "../features/videoCall/videoCallSlice";
import roleReducer from "../features/role/roleSlice";
import studentReducer from "../features/student/studentSlice";
import financeReducer from "../features/admin/financeSlice";
import paymentReducer from "../features/payment/paymentSlice";
import chatReducer from "../features/classroom/chatSlice";
import attendanceReducer from "../features/attendance/attendanceSlice";
import sessionReducer from "../features/session/sessionSlice";
import examReducer from "../features/exam/examSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    dashboard: dashboardReducer,
    mentor: mentorReducer,
    studentTrial: studentTrialReducer,
    videoCall: videoCallReducer,
    role: roleReducer,
    student: studentReducer,
    finance: financeReducer,
    payment: paymentReducer,
    chat: chatReducer,
    attendance: attendanceReducer,
    exam: examReducer,
    session: sessionReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore MediaStream objects in videoCall state
        ignoredActions: ['videoCall/setLocalStream', 'videoCall/setRemoteStream'],
        ignoredPaths: ['videoCall.localStream', 'videoCall.remoteStream'],
      },
    }),

  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
