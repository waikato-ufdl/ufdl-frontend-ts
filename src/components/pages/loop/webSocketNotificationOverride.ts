import {NotificationOverride} from "ufdl-ts-client/json/generated/CreateJobSpec";

export default function webSocketNotificationOverride(
    // No parameters
): NotificationOverride {
    // All transitions simply notify via web-socket (indicated by the empty object)
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
