import { ROUTES } from "../constants/routes.constants";

export type NavItem = {
    label: string;
    href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home",          href: ROUTES.HOME },
  { label: "Why Aptus",     href: "#why" },
  { label: "How it Works",  href: "#how" },
  { label: "Testimonials",  href: "#testimonials" },
  { label: "FAQ",           href: "#faq" },
];