import type { Timestamp } from "firebase/firestore";

export type Format = "podcast" | "video" | "article" | "instagram";

export const FORMATS: Format[] = ["podcast", "video", "article", "instagram"];

export const FORMAT_LABELS: Record<Format, string> = {
  podcast: "Podcast",
  video: "Video",
  article: "Article",
  instagram: "Instagram",
};

export type Role = "admin" | "contributor" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  colour: string;
  role: Role;
  pushTokens: string[];
  icalToken: string;
  createdAt: Timestamp | null;
  hiddenHomeCards?: string[];
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  createdAt: Timestamp | null;
  acceptedAt: Timestamp | null;
}

export type IdeaStatus = "new" | "developing" | "approved" | "scheduled" | "published" | "parked";

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  new: "New",
  developing: "Developing",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  parked: "Parked",
};

export interface Idea {
  id: string;
  title: string;
  pitch?: string;
  formats: Format[];
  formatAngles?: Partial<Record<Format, string>>;
  status: IdeaStatus;
  tags: string[];
  priority: "normal" | "high";
  ownerId: string;
  upvotes: string[]; // user ids who upvoted
  entryCount: number; // denormalised count of notes/images/links/voice entries
  linkedOrgIds?: string[];
  linkedPersonIds?: string[];
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type EntryType = "note" | "image" | "link" | "voice";

export interface IdeaEntry {
  id: string;
  type: EntryType;
  body?: string; // note text / link URL / caption
  url?: string; // storage download URL for image/voice, or link URL
  linkTitle?: string;
  linkSite?: string;
  linkThumbnail?: string;
  format?: Format; // for per-format angle notes
  authorId: string;
  authorInitials: string;
  createdAt: Timestamp | null;
}

export type EventType = "recording" | "publish" | "event" | "meeting" | "deadline";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  recording: "Recording",
  publish: "Publish date",
  event: "Event",
  meeting: "Meeting",
  deadline: "Deadline",
};

export type EventStatus = "tentative" | "confirmed" | "done" | "cancelled";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  formats: Format[];
  start: Timestamp;
  end: Timestamp;
  allDay: boolean;
  location?: string;
  mapLink?: string;
  attendeeIds: string[]; // team member user ids
  externalPersonIds?: string[]; // Network people ids
  ideaIds: string[];
  orgIds?: string[];
  notes?: string;
  checklist: ChecklistItem[];
  repeatRule?: "none" | "daily" | "weekly" | "monthly";
  status: EventStatus;
  reminderOffsets: number[]; // minutes before start
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
}

export type PipelineStage =
  | "approved"
  | "prepped"
  | "recorded"
  | "editing"
  | "ready"
  | "published";

export const PIPELINE_STAGES: PipelineStage[] = [
  "approved",
  "prepped",
  "recorded",
  "editing",
  "ready",
  "published",
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  approved: "Approved",
  prepped: "Prepped",
  recorded: "Recorded",
  editing: "Editing",
  ready: "Ready",
  published: "Published",
};

export interface ContentItem {
  id: string;
  ideaId: string;
  format: Format;
  stage: PipelineStage;
  assigneeId?: string;
  dueDate?: Timestamp;
  checklist: ChecklistItem[];
  sponsorDeliverables?: { orgId: string; description: string; done: boolean }[];
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type OrgCategory =
  | "sponsor"
  | "brand_partner"
  | "golf_course"
  | "tourism"
  | "media"
  | "guest_talent"
  | "industry_body"
  | "other";

export const ORG_CATEGORY_LABELS: Record<OrgCategory, string> = {
  sponsor: "Sponsor",
  brand_partner: "Brand partner",
  golf_course: "Golf course / estate",
  tourism: "Tourism / hospitality",
  media: "Media",
  guest_talent: "Guest / talent",
  industry_body: "Industry body",
  other: "Other",
};

export type PartnershipStage =
  | "target"
  | "contacted"
  | "in_conversation"
  | "proposal_sent"
  | "signed"
  | "active"
  | "lapsed";

export const PARTNERSHIP_STAGES: PartnershipStage[] = [
  "target",
  "contacted",
  "in_conversation",
  "proposal_sent",
  "signed",
  "active",
  "lapsed",
];

export const PARTNERSHIP_STAGE_LABELS: Record<PartnershipStage, string> = {
  target: "Target",
  contacted: "Contacted",
  in_conversation: "In conversation",
  proposal_sent: "Proposal sent",
  signed: "Signed",
  active: "Active",
  lapsed: "Lapsed",
};

export interface DealNote {
  deliverables: string;
  termStart?: Timestamp;
  termEnd?: Timestamp;
  valueBand?: string;
}

export interface Org {
  id: string;
  name: string;
  category: OrgCategory;
  website?: string;
  logoUrl?: string;
  location?: string;
  ownerId: string; // relationship owner
  stage: PartnershipStage;
  tags: string[];
  notes?: string;
  wantToTalkTo?: boolean;
  wantToTalkToReason?: string;
  dealNotes?: DealNote; // Admin-only visibility enforced in UI + rules
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Person {
  id: string;
  name: string;
  role?: string;
  orgId?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  linkedin?: string;
  howWeKnowThem?: string;
  ownerId: string;
  tags: string[];
  starred?: boolean;
  notes?: string;
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type InteractionType = "call" | "email" | "meeting" | "whatsapp" | "event";

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  whatsapp: "WhatsApp",
  event: "Event",
};

export interface Interaction {
  id: string;
  parentType: "org" | "person";
  parentId: string;
  type: InteractionType;
  date: Timestamp;
  summary: string;
  nextStep?: string;
  nextStepDate?: Timestamp;
  authorId: string;
  authorInitials: string;
  createdAt: Timestamp | null;
}

export type LinkedItemType = "idea" | "event" | "contentItem" | "org" | "person" | "none";

export interface Task {
  id: string;
  title: string;
  assigneeId?: string;
  creatorId: string;
  dueDate?: Timestamp;
  priority: "normal" | "high";
  status: "open" | "done";
  linkedType: LinkedItemType;
  linkedId?: string;
  linkedLabel?: string; // denormalised human-readable label of the linked item
  notes?: string;
  completedAt?: Timestamp | null;
  completedBy?: string;
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ActivityLogEntry {
  id: string;
  entityType: "idea" | "event" | "contentItem" | "org" | "person" | "task";
  entityId: string;
  entityLabel: string;
  action: string; // human readable e.g. "changed status to Approved"
  authorId: string;
  authorInitials: string;
  createdAt: Timestamp | null;
}
