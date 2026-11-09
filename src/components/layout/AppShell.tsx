import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";
import QuickCaptureButton from "../quickcapture/QuickCaptureButton";

const MAIN_TABS = ["/", "/calendar", "/ideas", "/network"];

export default function AppShell() {
  const { pathname } = useLocation();
  const showQuickCapture = MAIN_TABS.includes(pathname);

  return (
    <div className="flex h-dvh flex-col bg-white">
      <Header />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      {showQuickCapture && <QuickCaptureButton />}
      <BottomTabBar />
    </div>
  );
}
