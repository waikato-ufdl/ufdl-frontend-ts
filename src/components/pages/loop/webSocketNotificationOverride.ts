import {NotificationOverride} from "ufdl-js-client/json/generated/CreateJobSpec";

export default function webSocketNotificationOverride(
    // No parameters
): NotificationOverride {
    return {
        actions: {
            on_abort: [{}],
            on_acquire: [{}],
            on_error: [{}],
            on_finish: [{}],
            on_progress: [{}],
            on_release: [{}],
            on_reset: [{}],
            on_start: [{}],
            on_cancel: [{}]
        }
    }
}
