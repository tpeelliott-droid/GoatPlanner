import { useState } from "react";
import { Plus, Lightbulb, CalendarPlus, UserPlus, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NewIdeaSheet from "./NewIdeaSheet";
import NewEventSheet from "../calendar/EventForm";
import NewContactSheet from "../network/NewContactSheet";
import VoiceNoteSheet from "./VoiceNoteSheet";

type Panel = "menu" | "idea" | "event" | "contact" | "voice" | null;

export default function QuickCaptureButton() {
  const [panel, setPanel] = useState<Panel>(null);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setPanel("menu")}
        aria-label="Quick capture"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-dark-green shadow-lg shadow-black/30 transition active:scale-95"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {panel === "menu" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/50" onClick={() => setPanel(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-24 mr-4 ml-auto flex w-56 flex-col overflow-hidden rounded-2xl border border-white/10 bg-fairway safe-bottom"
          >
            <MenuItem icon={Lightbulb} label="New idea" onClick={() => setPanel("idea")} />
            <MenuItem icon={CalendarPlus} label="New event" onClick={() => setPanel("event")} />
            <MenuItem icon={UserPlus} label="New contact" onClick={() => setPanel("contact")} />
            <MenuItem icon={Mic} label="Voice note" onClick={() => setPanel("voice")} last />
          </div>
        </div>
      )}

      {panel === "idea" && (
        <NewIdeaSheet
          onClose={() => setPanel(null)}
          onCreated={(id) => {
            setPanel(null);
            navigate(`/ideas/${id}`);
          }}
        />
      )}
      {panel === "event" && <NewEventSheet onClose={() => setPanel(null)} />}
      {panel === "contact" && <NewContactSheet onClose={() => setPanel(null)} />}
      {panel === "voice" && (
        <VoiceNoteSheet
          onClose={() => setPanel(null)}
          onCreated={(id) => {
            setPanel(null);
            navigate(`/ideas/${id}`);
          }}
        />
      )}
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  last = false,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 text-left text-sm text-parchment transition active:bg-white/10 ${
        !last ? "border-b border-white/10" : ""
      }`}
    >
      <Icon size={18} className="text-gold" />
      {label}
    </button>
  );
}
