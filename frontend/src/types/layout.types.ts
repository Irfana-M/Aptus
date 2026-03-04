import React from "react";

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  disabled?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}
