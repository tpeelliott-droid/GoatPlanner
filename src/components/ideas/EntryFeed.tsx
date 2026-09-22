import { useRef, useState, type ChangeEvent } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Image as ImageIcon, Link as LinkIcon, Send } from "lucide-react";
import InitialsChip from "../common/InitialsChip";
import { TextInput } from "../common/FormField";
import { addIdeaEntry, useIdeaEntries } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";
import { storage } from "../../firebase/config";
import { relativeTime } from "../../utils/dates";
import { compressImage } from "../../utils/image";

export default function EntryFeed({ ideaId }: { ideaId: string }) {
  const profile = useAuthStore((s) => s.profile);
  const { data: entries } = useIdeaEntries(ideaId);
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function submitNote() {
    if (!profile || !note.trim()) return;
    await addIdeaEntry(ideaId, {
      type: "note",
      body: note.trim(),
      authorId: profile.id,
      authorInitials: profile.initials,
    });
    setNote("");
  }

  async function submitLink() {
    if (!profile || !linkUrl.trim()) return;
    setBusy(true);
    try {
      let linkTitle = linkUrl;
      let linkSite = "";
      try {
        linkSite = new URL(linkUrl).hostname.replace("www.", "");
      } catch {
        /* not a full URL, ignore */
      }
      await addIdeaEntry(ideaId, {
        type: "link",
        url: linkUrl.trim(),
        linkTitle,
        linkSite,
        authorId: profile.id,
        authorInitials: profile.initials,
      });
      setLinkUrl("");
      setShowLinkInput(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setBusy(true);
    try {
      const compressed = await compressImage(file, 1600);
      const path = `idea-images/${ideaId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, compressed);
      const url = await getDownloadURL(storageRef);
      await addIdeaEntry(ideaId, {
        type: "image",
        url,
        authorId: profile.id,
        authorInitials: profile.initials,
      });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const images = entries.filter((e) => e.type === "image");

  return (
    <section className="mb-5">
      <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-parchment/60">
        Notes &amp; attachments
      </h3>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {images.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {entries
          .filter((e) => e.type !== "image")
          .map((entry) => (
            <div key={entry.id} className="flex gap-2.5">
              <InitialsChip initials={entry.authorInitials} size="xs" />
              <div className="min-w-0 flex-1">
                {entry.type === "note" && <p className="whitespace-pre-wrap text-sm text-parchment">{entry.body}</p>}
                {entry.type === "link" && (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm text-gold underline"
                  >
                    {entry.linkTitle || entry.url}
                  </a>
                )}
                {entry.type === "voice" && (
                  <audio controls src={entry.url} className="h-8 w-full max-w-xs" />
                )}
                <p className="mt-0.5 text-[11px] text-parchment/40">{relativeTime(entry.createdAt)}</p>
              </div>
            </div>
          ))}
      </div>

      {showLinkInput && (
        <div className="mt-3 flex gap-2">
          <TextInput
            autoFocus
            placeholder="Paste a link…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <button onClick={submitLink} disabled={busy} className="flex-none rounded-lg bg-gold px-3 text-dark-green">
            <Send size={16} />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <TextInput
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitNote()}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-none rounded-lg border border-parchment/15 p-2.5 text-parchment/60"
          aria-label="Add image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          onClick={() => setShowLinkInput((v) => !v)}
          className="flex-none rounded-lg border border-parchment/15 p-2.5 text-parchment/60"
          aria-label="Add link"
        >
          <LinkIcon size={16} />
        </button>
        <button onClick={submitNote} className="flex-none rounded-lg bg-gold p-2.5 text-dark-green">
          <Send size={16} />
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </section>
  );
}
