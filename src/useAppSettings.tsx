import React, {Dispatch, ReactNode} from "react";
import useStateSafe from "./util/react/hooks/useStateSafe";
import {constantInitialiser} from "./util/typescript/initialisers";
import {mapObject, mapOwnProperties} from "./util/typescript/object";
import capitalize from "./util/typescript/strings/capitalize";
import UFDLServerContext from "../../ufdl-ts-client/dist/UFDLServerContext";

/** The type of the settings for the single-page app. */
export type AppSettings = {
    readonly prelabelMode: "None" | "Single" | "Multi" | "Default"
}

export type AppSettingDispatchName<SettingName extends string> = `set${Capitalize<SettingName>}`

export function getSettingDispatchName<SettingName extends string>(
    settingName: SettingName
): AppSettingDispatchName<SettingName> {
    return `set${capitalize(settingName)}` as any
}

/** The type of the dispatch object for changing the settings. */
export type AppSettingsDispatch = {
    readonly [Setting in keyof AppSettings as AppSettingDispatchName<Setting>]: Dispatch<AppSettings[Setting]>
}

/** The app's default settings. */
const DEFAULT_APP_SETTINGS: AppSettings = {
    prelabelMode: "Default"
} as const

const DEFAULT_APP_SETTINGS_DISPATCH: AppSettingsDispatch = mapObject(
    DEFAULT_APP_SETTINGS,
    property => {
        return {
            [getSettingDispatchName(property)]: () => {
                throw new Error(`Can't set app setting ${property} on default settings object`)
            }
        }
    }
)


/** The React context which specifies the app's settings. */
export const APP_SETTINGS_REACT_CONTEXT = React.createContext([DEFAULT_APP_SETTINGS, DEFAULT_APP_SETTINGS_DISPATCH] as const);

/**
 * The type of props passed to the AppSettingsProvider component.
 */
export type AppSettingsProviderProps = {
    settings: AppSettings
    dispatch: AppSettingsDispatch
    children: ReactNode
}

/**
 * Component which provides the app's settings to its children.
 *
 * @param props
 *          The props of the component.
 */
export function AppSettingsProvider(
    props: AppSettingsProviderProps
) {
    return <APP_SETTINGS_REACT_CONTEXT.Provider value={[props.settings, props.dispatch]}>
        {props.children}
    </APP_SETTINGS_REACT_CONTEXT.Provider>
}

/** Hook which maintains the app's settings as state. */
export function useAppSettings(
    // No parameters
): [AppSettings, AppSettingsDispatch] {
    // Create state for the prelabelMode setting
    const [prelabelMode, setPrelabelMode] = useStateSafe(constantInitialiser(DEFAULT_APP_SETTINGS.prelabelMode))

    return [
        {
            prelabelMode
        },
        {
            setPrelabelMode
        }
    ]
}

export async function saveSettingsToContext(
    settings: AppSettings,
    context: UFDLServerContext
) {
    context.store_item(
        "AppSettings",
        JSON.stringify(settings),
        true
    ).catch(
        reason => console.error("Failed to save settings to context", reason)
    )
}

export async function loadSettingsFromContext(
    context: UFDLServerContext,
    dispatch?: AppSettingsDispatch
): Promise<AppSettings> {
    const serialised = await context.get_item("AppSettings", true)

    const deserialised: AppSettings = serialised !== null
        ? JSON.parse(serialised)
        : {...DEFAULT_APP_SETTINGS}

    if (dispatch !== undefined) {
        mapOwnProperties(
            deserialised,
            (setting, value) => dispatch[getSettingDispatchName(setting)](value)
        )
    }

    return deserialised
}
