import { Home, Scale, Briefcase, Users, HandCoins, Clock } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/gender-pay-gap", label: "Gender Pay Gap", icon: Scale },
  { to: "/job-tenure", label: "Job Tenure by Sex", icon: Briefcase },
  { to: "/employment-rate", label: "Employment Rate by Sex", icon: Users },
  { to: "/in-work-poverty", label: "In-Work Poverty by Sex", icon: HandCoins },
  { to: "/weekly-hours", label: "Mean Weekly Hours by Sex", icon: Clock },
] as const;

export const TOPICS = [
  {
    to: "/employment-rate",
    title: "Employment Rate",
    desc: "Share of people aged 20–64 in employment, compared across European countries and by sex.",
    accent: "var(--elms-navy)",
  },
  {
    to: "/job-tenure",
    title: "Job Tenure",
    desc: "How long employees stay in their current job, broken down by tenure bands and sex.",
    accent: "var(--elms-plum)",
  },
  {
    to: "/weekly-hours",
    title: "Weekly Working Hours",
    desc: "Mean weekly hours usually worked per employee, contrasting men and women.",
    accent: "var(--elms-magenta)",
  },
  {
    to: "/gender-pay-gap",
    title: "Gender Pay Gap",
    desc: "Unadjusted gender pay gap across industry, construction and services.",
    accent: "var(--elms-navy-deep)",
  },
  {
    to: "/in-work-poverty",
    title: "In-Work Poverty",
    desc: "Share of employed people at risk of poverty, by sex and country.",
    accent: "var(--elms-plum)",
  },
] as const;
