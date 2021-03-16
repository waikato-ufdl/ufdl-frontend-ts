import {NotificationOverrideActions} from "ufdl-js-client/json/generated/CreateJobSpec";
import {RawJSONObject} from "ufdl-js-client/types";

export type TransitionHandlers = {
    [key in keyof NotificationOverrideActions]: (json: RawJSONObject) => void
}
