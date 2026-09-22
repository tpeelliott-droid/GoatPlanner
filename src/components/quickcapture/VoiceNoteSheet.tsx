import { useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Mic, Square } from "lucide-react";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field } from "../common/FormField";
import { storage } from "../../firebase/config";
import { addIdeaEntry, createIdea, useIdeas } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";

const MAX_SECONDS = 180;

export default function VoiceNoteSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const profile = useAuthStore((s) => s.profile);
  const { data: ideas } = useIdeas();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [targetIdeaId, setTargetIdeaId] = useState<string>("__new__");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Couldn't access the microphone.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleSave() {
    if (!blob || !profile) return;
    setSaving(true);
    setError(null);
    try {
      let ideaId = targetIdeaId;
      if (ideaId === "__new__") {
        ideaId = await createIdea(
          { title: `Voice note — ${new Date().toLocaleString()}`, formats: [], ownerId: profile.id },
          { id: profile.id, initials: profile.initials },
        );
      }
      const path = `voice-notes/${ideaId}/${Date.now()}.webm`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await addIdeaEntry(ideaId, {
        type: "voice",
        url,
        authorId: profile.id,
        authorInitials: profile.initials,
      });
      onCreated(ideaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the voice note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="Voice note" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 py-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex h-20 w-20 items-center justify-center rounded-full transition ${
            recording ? "bg-rust" : "bg-gold"
          }`}
        >
          {recording ? (
            <Square size={28} className="text-parchment" />
          ) : (
            <Mic size={28} className="text-dark-green" />
          )}
        </button>
        <p className="font-display text-2xl tabular-nums text-parchment">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </p>
        <p className="text-xs text-parchment/50">
          {recording ? "Recording — tap to stop (max 3:00)" : blob ? "Recorded" : "Tap to record"}
        </p>
      </div>

      {blob && (
        <>
          <Field label="Save to">
            <select
              value={targetIdeaId}
              onChange={(e) => setTargetIdeaId(e.target.value)}
              className="w-full rounded-lg border border-parchment/15 bg-white/5 px-3 py-2.5 text-sm text-parchment focus:border-gold focus:outline-none"
            >
              <option value="__new__">New idea</option>
              {ideas.slice(0, 25).map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.title}
                </option>
              ))}
            </select>
          </Field>
          {error && <p className="mb-3 text-sm text-rust">{error}</p>}
          <Button variant="accent" full onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save voice note"}
          </Button>
        </>
      )}
    </Sheet>
  );
}
