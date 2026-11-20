import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Phone notifications. Local ones (morning menu reminder, family activity while the app is running)
// work without any server. Alerts to a closed app need push credentials; see docs/SETUP.md.

const supported = Platform.OS !== 'web';
const MORNING = 'morning-menu';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function allowNotifications(): Promise<boolean> {
  if (!supported) return false;
  const now = await Notifications.getPermissionsAsync();
  if (now.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function notifyNow(title: string, body: string) {
  if (!supported || !(await allowNotifications())) return;
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}

/** Every morning at `hour`: "Today's lunch: ...". Replaces any earlier reminder. */
export async function scheduleMorningMenu(hour: number, title: string, body: string) {
  if (!supported || !(await allowNotifications())) return false;
  await Notifications.cancelScheduledNotificationAsync(MORNING).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: MORNING,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
  });
  return true;
}

export async function cancelMorningMenu() {
  if (supported) await Notifications.cancelScheduledNotificationAsync(MORNING).catch(() => {});
}
