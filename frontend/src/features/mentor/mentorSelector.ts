import type { RootState } from "../../app/store";

export const selectMentorProfile = (state: RootState) => state.mentor.profile;
export const selectPendingMentors = (state: RootState) => state.mentor.pendingMentors;
export const selectMentorLoading = (state: RootState) => state.mentor.loading;
export const selectMentorError = (state: RootState) => state.mentor.error;
