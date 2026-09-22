import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import InitialsChip from "../common/InitialsChip";
import { useAuthStore } from "../../store/useAuthStore";
import SearchOverlay from "../search/SearchOverlay";

const TITLES: Record<string, string> = {
  "/": "Home",
  "/calendar": "Calendar",
  "/ideas": "Ideas",
  "/pipeline": "Pipeline",
  "/network": "Network",
  "/my-list": "My List",
  "/settings": "Settings",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const root = "/" + pathname.split("/")[1];
  return TITLES[root] ?? "Goat Track Planner";
}

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-dark-green px-4 py-3 safe-top">
        <h1 className="font-display text-lg uppercase tracking-wider text-parchment">
          {titleFor(pathname)}
        </h1>
        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="rounded-full p-2 text-parchment/70 transition active:bg-white/10"
          >
            <Search size={20} />
          </button>
          <button aria-label="Settings" onClick={() => navigate("/settings")}>
            {profile && (
              <InitialsChip initials={profile.initials} colour={profile.colour} size="md" />
            )}
          </button>
        </div>
      </header>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
