import { ChartColumn, House, Plus, Settings, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { NavLink } from "react-router";
import { tapScale } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { PigIcon } from "./PigIcon";

type TabIcon = LucideIcon | typeof PigIcon;

const LEFT_TABS: { to: string; label: string; Icon: TabIcon }[] = [
  { to: "/", label: "Home", Icon: House },
  { to: "/insights", label: "Insights", Icon: ChartColumn },
];
const RIGHT_TABS: { to: string; label: string; Icon: TabIcon }[] = [
  { to: "/piggy", label: "Piggy", Icon: PigIcon },
  { to: "/settings", label: "Settings", Icon: Settings },
];

interface TabBarProps {
  onAdd: () => void;
}

/** Floating glass tab bar with the raised white + (PRD §9). */
export function TabBar({ onAdd }: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 z-30 mx-auto max-w-[560px] px-screen"
      style={{ bottom: "max(var(--safe-bottom), 16px)" }}
    >
      <div className="glass flex h-(--tab-bar-height) items-center rounded-pill px-2">
        {LEFT_TABS.map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
        <div className="flex flex-1 justify-center">
          <motion.button
            type="button"
            aria-label="Add expense"
            onClick={onAdd}
            whileTap={tapScale}
            className="grid size-14 -translate-y-3 place-items-center rounded-pill bg-text-1 text-bg ring-[5px] ring-bg"
          >
            <Plus aria-hidden="true" className="size-7" strokeWidth={2.5} />
          </motion.button>
        </div>
        {RIGHT_TABS.map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ to, label, Icon }: { to: string; label: string; Icon: TabIcon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
          isActive ? "text-text-1" : "text-text-3",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className="size-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
          <span className="text-micro font-medium tracking-normal">{label}</span>
        </>
      )}
    </NavLink>
  );
}
