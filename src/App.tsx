import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./components/auth/AuthProvider";
import AppShell from "./components/layout/AppShell";
import HomeDashboard from "./components/home/HomeDashboard";
import CalendarPage from "./components/calendar/CalendarPage";
import IdeasPage from "./components/ideas/IdeasPage";
import IdeaDetailPage from "./components/ideas/IdeaDetailPage";
import PipelinePage from "./components/pipeline/PipelinePage";
import NetworkPage from "./components/network/NetworkPage";
import OrgDetailPage from "./components/network/OrgDetailPage";
import PersonDetailPage from "./components/network/PersonDetailPage";
import MyListPage from "./components/mylist/MyListPage";
import SettingsPage from "./components/settings/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomeDashboard />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="ideas" element={<IdeasPage />} />
            <Route path="ideas/:id" element={<IdeaDetailPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="network" element={<NetworkPage />} />
            <Route path="network/orgs/:id" element={<OrgDetailPage />} />
            <Route path="network/people/:id" element={<PersonDetailPage />} />
            <Route path="my-list" element={<MyListPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
