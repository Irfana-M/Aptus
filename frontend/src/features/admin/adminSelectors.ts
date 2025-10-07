import type { RootState } from "../../app/store";

export const selectAdmin = (state: RootState) => state.admin.admin;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;
