import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";
import QuickCaptureButton from "../quickcapture/QuickCaptureButton";

export default function AppShell() {
  return (
    <div className="flex h-dvh flex-col bg-white">
      <Header />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <QuickCaptureButton />
      <BottomTabBar />
    </div>
  );
}
