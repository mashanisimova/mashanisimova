import {
  Activity,
  AlertTriangle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CreditCard,
  DollarSign,
  Cpu,
  Home,
  LayoutDashboard,
  Lock,
  Moon,
  MoreVertical,
  Settings,
  SunMedium,
  Wallet,
  Bot,
  type LucideProps,
} from "lucide-react";

export type Icon = typeof BarChart2;

export const Icons = {
  activity: Activity,
  logo: Cpu,
  alert: AlertTriangle,
  dashboard: LayoutDashboard,
  billing: CreditCard,
  cloud: Cloud,
  dollar: DollarSign,
  home: Home,
  lock: Lock,
  moon: Moon,
  sun: SunMedium,
  wallet: Wallet,
  chart: BarChart2,
  settings: Settings,
  more: MoreVertical,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  bot: function Bot(props: LucideProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    );
  },
};
