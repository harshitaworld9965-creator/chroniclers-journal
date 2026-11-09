import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { App as CapApp } from '@capacitor/app'
import { db } from '../db/db'

export const isNative = Capacitor.isNativePlatform()

const CHANNEL_ID = 'reminders'
const ACTION_TYPE = 'REMINDER_ACTIONS'
const SLOTS = 1000 // notification ids reserved per reminder
const SNOOZE_SLOT = 999
const SNOOZE_MINUTES = 10
const AHEAD = { daily: 30, weekly: 12 } // how many future repeats to queue
const TEST_ID = 2_000_000_000

const notifId = (reminderId, slot) => reminderId * SLOTS + slot
const reminderIdOf = (id) => Math.floor(id / SLOTS)

/* ---------- When should a reminder ring? ---------- */
export function upcomingTimes(reminder, now = Date.now()) {
  if (!reminder.repeat || reminder.repeat === 'none') {
    return reminder.done || reminder.dueAt <= now ? [] : [reminder.dueAt]
  }

  const stepDays = reminder.repeat === 'weekly' ? 7 : 1
  const d = new Date(reminder.dueAt)
  while (d.getTime() <= now) d.setDate(d.getDate() + stepDays)

  const times = []
  for (let i = 0; i < AHEAD[reminder.repeat]; i++) {
    times.push(d.getTime())
    d.setDate(d.getDate() + stepDays)
  }
  return times
}

/* ---------- Scheduling ---------- */
async function pendingIds() {
  const { notifications } = await LocalNotifications.getPending()
  return notifications.map((n) => n.id)
}

function buildNotification(reminder, at, slot) {
  return {
    id: notifId(reminder.id, slot),
    title: reminder.title,
    body: reminder.note || 'A gentle nudge from your journal.',
    schedule: { at: new Date(at), allowWhileIdle: true },
    channelId: CHANNEL_ID,
    actionTypeId: ACTION_TYPE,
    extra: { reminderId: reminder.id },
  }
}

export async function cancelReminder(reminderId, { keepSnooze = false } = {}) {
  if (!isNative) return
  const ids = (await pendingIds()).filter(
    (id) =>
      reminderIdOf(id) === reminderId &&
      !(keepSnooze && id % SLOTS === SNOOZE_SLOT)
  )
  if (ids.length) {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
  }
}

export async function scheduleReminder(reminder, { keepSnooze = true } = {}) {
  if (!isNative) return
  await cancelReminder(reminder.id, { keepSnooze })

  const times = upcomingTimes(reminder)
  if (!times.length) return

  await LocalNotifications.schedule({
    notifications: times.map((at, i) => buildNotification(reminder, at, i)),
  })
}

export async function snoozeReminder(reminderId, minutes = SNOOZE_MINUTES) {
  if (!isNative) return
  const reminder = await db.reminders.get(reminderId)
  if (!reminder) return
  await LocalNotifications.schedule({
    notifications: [
      buildNotification(reminder, Date.now() + minutes * 60_000, SNOOZE_SLOT),
    ],
  })
}

// Makes Android's queue match the database exactly
export async function reconcileAll() {
  if (!isNative) return
  const reminders = await db.reminders.toArray()
  const known = new Set(reminders.map((r) => r.id))

  const orphans = (await pendingIds()).filter(
    (id) => id !== TEST_ID && !known.has(reminderIdOf(id))
  )
  if (orphans.length) {
    await LocalNotifications.cancel({
      notifications: orphans.map((id) => ({ id })),
    })
  }

  for (const r of reminders) await scheduleReminder(r, { keepSnooze: true })
}

/* ---------- Permissions + status ---------- */
export async function ensurePermission() {
  if (!isNative) return false
  let { display } = await LocalNotifications.checkPermissions()
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    ;({ display } = await LocalNotifications.requestPermissions())
  }
  return display === 'granted'
}

export async function getStatus() {
  if (!isNative) return { native: false }
  const { display } = await LocalNotifications.checkPermissions()
  let exact = 'unknown'
  try {
    exact = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm
  } catch {
    // older Android: exact alarms don't need a setting
  }
  const { notifications } = await LocalNotifications.getPending()
  return { native: true, permission: display, exact, pending: notifications.length }
}

export function openExactAlarmSettings() {
  if (isNative) LocalNotifications.changeExactNotificationSetting()
}

export async function sendTestNotification(seconds = 60) {
  if (!isNative) return
  await ensurePermission()
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_ID,
        title: 'A test from the Chronicler',
        body: 'If you can read this, reminders work. ✦',
        schedule: { at: new Date(Date.now() + seconds * 1000), allowWhileIdle: true },
        channelId: CHANNEL_ID,
      },
    ],
  })
}

/* ---------- One-time setup when the app starts ---------- */
let started = false

export async function initNotifications() {
  if (!isNative || started) return
  started = true

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Reminders',
    description: "Reminders from The Chronicler's Journal",
    importance: 5,
    visibility: 1,
    vibration: true,
  })

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: ACTION_TYPE,
        actions: [
          { id: 'snooze', title: `Snooze ${SNOOZE_MINUTES} min` },
          { id: 'done', title: 'Done' },
        ],
      },
    ],
  })

  await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async ({ actionId, notification }) => {
      const reminderId = notification.extra?.reminderId
      if (!reminderId) return

      if (actionId === 'snooze') await snoozeReminder(reminderId)

      if (actionId === 'done') {
        const r = await db.reminders.get(reminderId)
        if (r && r.repeat === 'none') {
          await db.reminders.update(reminderId, { done: true })
          await cancelReminder(reminderId)
        }
      }
    }
  )

  // Every time the app comes back to the front, re-check the queue
  await CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) reconcileAll()
  })

  await reconcileAll()
}