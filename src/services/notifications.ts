import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export interface ScheduledNotification {
    identifier: string;
    medId: number;
    medName: string;
    time: string;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Notification permissions not granted");
        return false;
    }

    // Configure for Android
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("medication-reminders", {
            name: "Medication Reminders",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#007AFF",
        });
    }

    return true;
}

/**
 * Schedule medication reminders for the duration of the prescription
 * @param medId - Medicine ID
 * @param medName - Medicine name
 * @param times - Array of times in HH:mm format
 * @param durationDays - Number of days to schedule
 * @param startDate - Start date ISO string
 */
export async function scheduleMedicationReminders(
    medId: number,
    medName: string,
    times: string[],
    durationDays: number,
    startDate: string
): Promise<string[]> {
    const identifiers: string[] = [];
    const start = new Date(startDate);

    for (let day = 0; day < durationDays; day++) {
        for (const time of times) {
            const [hours, minutes] = time.split(":").map(Number);

            const triggerDate = new Date(start);
            triggerDate.setDate(triggerDate.getDate() + day);
            triggerDate.setHours(hours, minutes, 0, 0);

            // Skip if the time has already passed
            if (triggerDate <= new Date()) {
                continue;
            }

            try {
                const identifier = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "💊 복용 시간입니다!",
                        body: `${medName}을(를) 복용할 시간입니다.`,
                        data: { medId, medName, time },
                        sound: "default",
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate,
                    },
                });
                identifiers.push(identifier);
            } catch (error) {
                console.error("Failed to schedule notification:", error);
            }
        }
    }

    console.log(`Scheduled ${identifiers.length} notifications for ${medName}`);
    return identifiers;
}

/**
 * Cancel all notifications for a specific medicine
 * @param medId - Medicine ID
 */
export async function cancelMedicationReminders(medId: number): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
        if (notification.content.data?.medId === medId) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }

    console.log(`Cancelled all notifications for med ID: ${medId}`);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications cancelled");
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
}
