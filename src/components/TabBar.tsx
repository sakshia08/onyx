import { ChartColumn, House, Plus, Settings, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { NavLink, useLocation } from "react-router";
import { tapScale } from "@/lib/motion";
import { PigIcon } from "./PigIcon";

type TabIcon = LucideIcon | typeof PigIcon;

const TABS: { to: string; label: string; Icon: TabIcon }[] = [
  { to: "/", label: "Home", Icon: House },
  { to: "/insights", label: "Insights", Icon: ChartColumn },
  { to: "/piggy", label: "Piggy", Icon: PigIcon },
  { to: "/settings", label: "Settings", Icon: Settings },
];

interface TabBarProps {
  onAdd: () => void;
}

/** A floating glass pill of four tabs, with the white + standing on its own beside it (PRD §9). */
export function TabBar({ onAdd }: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 z-30 mx-auto flex max-w-[560px] gap-3 px-screen"
      style={{ bottom: "max(var(--safe-bottom), 16px)" }}
    >
      <div className="glass flex h-(--tab-bar-height) flex-1 items-center justify-around rounded-pill px-2">
        {TABS.map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
      </div>
      <motion.button
        type="button"
        aria-label="Add expense"
        onClick={onAdd}
        whileTap={tapScale}
        className="grid size-(--tab-bar-height) shrink-0 place-items-center rounded-pill bg-text-1 text-bg"
      >
        <Plus aria-hidden="true" className="size-7" strokeWidth={2.5} />
      </motion.button>
    </nav>
  );
}

/** Home stays active inside its own screens, like bucket detail. */
const HOME_PATHS = /^\/(bucket\/.*)?$/;

function TabLink({ to, label, Icon }: { to: string; label: string; Icon: TabIcon }) {
  const { pathname } = useLocation();
  return (
    <NavLink
      to={to}
      end={to === "/"}
      aria-label={label}
      className="relative grid size-12 place-items-center"
    >
      {({ isActive: linkActive }) => {
        const isActive = to === "/" ? HOME_PATHS.test(pathname) : linkActive;
        return (
          <>
            <Icon
              aria-hidden="true"
              className={isActive ? "size-6 text-text-1" : "size-6 text-text-3"}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            {isActive && (
              <motion.span
                layoutId="tab-dot"
                aria-hidden="true"
                className="absolute bottom-0.5 size-1 rounded-pill bg-text-1"
              />
            )}
          </>
        );
      }}
    </NavLink>
  );
}
