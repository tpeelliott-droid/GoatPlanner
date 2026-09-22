import { NavLink } from "react-router-dom";
import { Calendar, Home, Lightbulb, KanbanSquare, Users } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/calendar", label: "Calendar", icon: Calendar, end: false },
  { to: "/ideas", label: "Ideas", icon: Lightbulb, end: false },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare, end: false },
  { to: "/network", label: "Network", icon: Users, end: false },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-dark-green safe-bottom">
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-display uppercase tracking-wide transition-colors",
                  isActive ? "text-gold" : "text-parchment/50",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  {label}
                  <span
                    className={clsx(
                      "h-0.5 w-6 rounded-full transition-opacity",
                      isActive ? "bg-gold opacity-100" : "opacity-0",
                    )}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
