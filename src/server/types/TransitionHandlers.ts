import {NotificationOverrideActions} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {RawJSONObject} from "ufdl-ts-client/types/raw";

export type TransitionHandlers = {
    [key in keyof NotificationOverrideActions]: (json: RawJSONObject) => void
}
