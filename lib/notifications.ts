import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNEL_ID = 'pomodoro-completion';
let notificationsInitialized = false;

export async function initializeNotifications() {
  if (notificationsInitialized) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Pomodoro completion',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 200, 250],
    });
  }

  notificationsInitialized = true;
}

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function schedulePomodoroCompletionNotification(secondsFromNow: number, title?: string) {
  if (secondsFromNow <= 0) return null;

  await initializeNotifications();

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pomodoro complete',
      body: title?.trim() ? `${title.trim()} is complete. Take a break.` : 'Your focus session is complete. Take a break.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.ceil(secondsFromNow)),
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}

export async function cancelScheduledNotification(notificationId: string | null) {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore missing/expired notification IDs.
  }
}
