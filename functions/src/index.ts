import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { buildIcsFeed } from "./ical.js";

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * Private per-user iCal feed (read-only, one-way export). The token is just an
 * unguessable id embedded in the URL — see users/{uid}.icalToken — so this
 * looks up the user by token rather than trusting a uid directly.
 */
export const icalFeed = onRequest({ cors: true }, async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(400).send("Missing token");
    return;
  }

  const userSnap = await db.collection("users").where("icalToken", "==", token).limit(1).get();
  if (userSnap.empty) {
    res.status(404).send("Feed not found");
    return;
  }

  const eventsSnap = await db.collection("events").where("deletedAt", "==", null).get();
  const events = eventsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((e: any) => e.status !== "cancelled") as any[];

  const ics = buildIcsFeed(events, "Goat Track Planner");
  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(ics);
});

async function pushToUser(userId: string, notification: { title: string; body: string; url?: string }) {
  const userSnap = await db.collection("users").doc(userId).get();
  const tokens: string[] = userSnap.data()?.pushTokens ?? [];
  if (tokens.length === 0) return;
  await messaging
    .sendEachForMulticast({
      tokens,
      notification: { title: notification.title, body: notification.body },
      webpush: notification.url
        ? { fcmOptions: { link: notification.url }, notification: { icon: "/icons/icon-192.png" } }
        : { notification: { icon: "/icons/icon-192.png" } },
    })
    .catch(() => undefined);
}

/** Notifies a task's new assignee. */
export const onTaskAssigned = onDocumentUpdated("tasks/{taskId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (after.assigneeId && after.assigneeId !== before.assigneeId) {
    await pushToUser(after.assigneeId, {
      title: "Assigned to you",
      body: after.title,
      url: "/my-list",
    });
  }
});

/** Runs every 15 minutes: pushes reminders for recordings/events at their configured offsets. */
export const eventReminders = onSchedule("every 15 minutes", async () => {
  const now = Timestamp.now();
  const windowEnd = Timestamp.fromMillis(now.toMillis() + 15 * 60 * 1000);

  const snap = await db
    .collection("events")
    .where("deletedAt", "==", null)
    .where("start", ">=", now)
    .where("start", "<=", Timestamp.fromMillis(now.toMillis() + 25 * 60 * 60 * 1000))
    .get();

  for (const doc of snap.docs) {
    const event = doc.data() as any;
    if (event.status === "cancelled") continue;
    const startMs = event.start.toMillis();
    for (const offsetMin of event.reminderOffsets ?? []) {
      const fireAt = startMs - offsetMin * 60 * 1000;
      if (fireAt >= now.toMillis() && fireAt <= windowEnd.toMillis()) {
        for (const attendeeId of event.attendeeIds ?? []) {
          await pushToUser(attendeeId, {
            title: event.title,
            body: `Starts in ${offsetMin >= 60 ? `${offsetMin / 60}h` : `${offsetMin}m`}`,
            url: `/calendar?event=${doc.id}&notif=1`,
          });
        }
      }
    }
  }
});

/** Daily 07:00 SAST digest of what's due today, per user. */
export const morningDigest = onSchedule({ schedule: "0 5 * * *", timeZone: "UTC" }, async () => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const tasksSnap = await db
    .collection("tasks")
    .where("status", "==", "open")
    .where("deletedAt", "==", null)
    .where("dueDate", ">=", Timestamp.fromDate(startOfDay))
    .where("dueDate", "<", Timestamp.fromDate(endOfDay))
    .get();

  const byUser = new Map<string, number>();
  for (const doc of tasksSnap.docs) {
    const assigneeId = doc.data().assigneeId;
    if (!assigneeId) continue;
    byUser.set(assigneeId, (byUser.get(assigneeId) ?? 0) + 1);
  }

  for (const [userId, count] of byUser) {
    await pushToUser(userId, {
      title: "Today's list",
      body: `${count} task${count === 1 ? "" : "s"} due today`,
      url: "/my-list?notif=1",
    });
  }
});
