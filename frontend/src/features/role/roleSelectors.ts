import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

const selectRoleState = (state: RootState) => state.role;

export const selectUserRole = createSelector(
  [selectRoleState],
  (roleState) => roleState.role
);

export const selectRoleLoading = createSelector(
  [selectRoleState],
  (roleState) => roleState.loading
);

export const selectRoleError = createSelector(
  [selectRoleState],
  (roleState) => roleState.error
);
