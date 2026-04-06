// lib/notifications.ts
// ─────────────────────────────────────────────────
// Handles all local notification scheduling for
// Al-Sakina's daily reminder feature.
//
// Install the required package first:
//   npx expo install expo-notifications
//
// Then add to app.json under "plugins":
//   ["expo-notifications", { "icon": "./assets/icon.png" }]
//
// How it works:
//   - Requests permission from the OS
//   - Cancels any existing daily reminder
//   - Schedules a new repeating daily trigger at the
//     user's chosen hour/minute IN THEIR DEVICE LOCAL TIME
//   - expo-notifications CalendarTrigger uses the device's
//     local clock, so 08:00 always means 8 AM wherever
//     the user physically is
// ─────────────────────────────────────────────────

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const NOTIFICATION_ID_KEY = "@al_sakina_notification_id";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── Permission ────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    // Android 13+ requires explicit permission
    await Notifications.setNotificationChannelAsync("daily-reminder", {
      name: "Daily Reminder",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ── Schedule ──────────────────────────────────────

/**
 * Schedule a daily local notification at the given local time.
 *
 * @param timeString  "HH:MM" in the user's LOCAL device time (e.g. "08:00")
 * @returns           true if scheduled successfully, false if permission denied
 */
export async function scheduleDailyReminder(timeString: string): Promise<boolean> {
  // Cancel existing reminder first (avoid duplicates)
  await cancelDailyReminder();

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const [hourStr, minuteStr] = timeString.split(":");
  const hour   = parseInt(hourStr,   10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) {
    console.warn("notifications.ts: invalid time string", timeString);
    return false;
  }

  // CalendarTrigger with repeats: true fires daily at the given
  // hour + minute in the DEVICE'S LOCAL TIMEZONE automatically.
  // No timezone conversion needed — the OS handles it.
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your daily reflection awaits ✨",
      body:  "Take a moment to connect with your heart today.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });

  // Persist the notification ID so we can cancel it later
  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
  console.log(`notifications.ts: scheduled daily reminder at ${timeString} local time (id: ${id})`);
  return true;
}

// ── Cancel ────────────────────────────────────────

/**
 * Cancel the current daily reminder, if any.
 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
      console.log("notifications.ts: cancelled reminder", id);
    }
  } catch (err) {
    console.warn("notifications.ts: cancel error", err);
  }
}

// ── Reschedule ────────────────────────────────────

/**
 * Update the reminder time. Cancels the old one and schedules a new one.
 *
 * @param timeString  "HH:MM" in local device time
 * @returns           true if rescheduled successfully
 */
export async function rescheduleDailyReminder(timeString: string): Promise<boolean> {
  return scheduleDailyReminder(timeString);
}

// ── Check current schedule ────────────────────────

/**
 * Returns true if a daily reminder is currently scheduled.
 */
export async function isDailyReminderScheduled(): Promise<boolean> {
  try {
    const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (!id) return false;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((n) => n.identifier === id);
  } catch {
    return false;
  }
}