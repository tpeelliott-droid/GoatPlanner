import { useState } from "react";
import { ArrowLeft, LogOut, Copy, RefreshCw, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InitialsChip from "../common/InitialsChip";
import { TextInput, Field } from "../common/FormField";
import Button from "../common/Button";
import TeamSection from "./TeamSection";
import { useAuthStore } from "../../store/useAuthStore";
import { signOut, suggestInitials } from "../../firebase/auth";
import { regenerateIcalToken, updateUser } from "../../hooks/useUsers";
import { icalFeedUrl } from "../../utils/functionsUrl";
import { requestPushPermission } from "../../firebase/messaging";
import { app } from "../../firebase/config";

export default function SettingsPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [name, setName] = useState(profile?.name ?? "");
  const [initials, setInitials] = useState(profile?.initials ?? "");
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  if (!profile) return null;

  async function saveProfile() {
    await updateUser(profile!.id, { name: name.trim(), initials: initials.trim().toUpperCase() });
    setProfile({ ...profile!, name: name.trim(), initials: initials.trim().toUpperCase() });
  }

  async function handleRegenerateFeed() {
    if (!confirm("Regenerate your calendar feed link? The old link will stop working.")) return;
    const token = await regenerateIcalToken(profile!.id);
    setProfile({ ...profile!, icalToken: token });
  }

  async function handleEnablePush() {
    setPushStatus("requesting");
    const token = await requestPushPermission(app);
    if (token) {
      await updateUser(profile!.id, { pushTokens: [...new Set([...profile!.pushTokens, token])] });
      setPushStatus("granted");
    } else {
      setPushStatus("denied");
    }
  }

  const feedUrl = icalFeedUrl(profile.icalToken);

  return (
    <div className="px-4 py-4">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink/60">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <InitialsChip initials={profile.initials} colour={profile.colour} size="md" />
        <div>
          <p className="text-sm text-ink">{profile.name}</p>
          <p className="text-xs text-ink/50 capitalize">{profile.role}</p>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="double-rule mb-3 font-display text-xs uppercase tracking-widest text-ink/60">
          Profile
        </h3>
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initials) setInitials(suggestInitials(e.target.value));
            }}
            onBlur={saveProfile}
          />
        </Field>
        <Field label="Initials">
          <TextInput
            value={initials}
            maxLength={3}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            onBlur={saveProfile}
          />
        </Field>
      </section>

      <section className="mb-6">
        <h3 className="double-rule mb-3 font-display text-xs uppercase tracking-widest text-ink/60">
          Notifications
        </h3>
        <Button variant="ghost" onClick={handleEnablePush} disabled={pushStatus === "requesting"}>
          <Bell size={14} />
          {pushStatus === "granted" ? "Notifications on" : "Enable push notifications"}
        </Button>
        {pushStatus === "denied" && (
          <p className="mt-2 text-xs text-rust">
            Notifications are blocked. Enable them for this site in your browser settings.
          </p>
        )}
      </section>

      <section className="mb-6">
        <h3 className="double-rule mb-3 font-display text-xs uppercase tracking-widest text-ink/60">
          Calendar sync
        </h3>
        <p className="mb-2 text-xs text-ink/50">
          Subscribe in Google Calendar, Outlook or Apple Calendar with this private link.
        </p>
        <div className="flex items-center gap-2">
          <TextInput readOnly value={feedUrl} className="truncate" />
          <button
            onClick={() => navigator.clipboard.writeText(feedUrl)}
            className="flex-none rounded-lg border border-ink/12 p-2.5 text-ink/60"
            aria-label="Copy link"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleRegenerateFeed}
            className="flex-none rounded-lg border border-ink/12 p-2.5 text-ink/60"
            aria-label="Regenerate link"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </section>

      {profile.role === "admin" && <TeamSection />}

      <Button variant="destructive" full onClick={() => signOut()} className="mt-4">
        <LogOut size={14} /> Sign out
      </Button>
    </div>
  );
}
