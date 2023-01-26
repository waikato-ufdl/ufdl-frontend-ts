import React, {Dispatch, ReactNode} from "react";
import useStateSafe from "./util/react/hooks/useStateSafe";
import {constantInitialiser} from "./util/typescript/initialisers";
import {mapObject} from "./util/typescript/object";
import capitalize from "./util/typescript/strings/capitalize";
import UFDLServerContext from "../../ufdl-ts-client/dist/UFDLServerContext";
import {DomainName} from "./server/domains";
import {ParameterValue} from "../../ufdl-ts-client/dist/json/generated/CreateJobSpec";

/** The type of the settings for the single-page app. */
export type AppSettings = {
    readonly prelabelMode: "None" | "Single" | "Multi" | "Default"
    readonly uploadBulkWherePossible: boolean
    readonly loopJobTemplateDefaults: {
        [Domain in DomainName]: {
            train?: {
                templatePK: number
                parameters: { [name: string]: ParameterValue }
            }
            predict?: {
                templatePK: number
                parameters: { [name: string]: ParameterValue }
            }
        }
    }
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
export const DEFAULT_APP_SETTINGS = {
    prelabelMode: "Default",
    uploadBulkWherePossible: true,
    loopJobTemplateDefaults: {
        'Image Classification': {
            train: {
                templatePK: 10,
                parameters: {
                    delay: {
                        value: 0,
                        type: "float"
                    },
                    factor: {
                        value: 100,
                        type: "int"
                    }
                }
            },
            predict: {
                templatePK: 11,
                parameters: {
                    per_class: {
                        value: false,
                        type: "bool"
                    },
                    store_predictions: {
                        value: true,
                        type: "bool"
                    }
                }
            }
        },
        'Object Detection': {},
        'Image Segmentation': {},
        'Speech': {}
    }
} as const

const DEFAULT_APP_SETTINGS_DISPATCH: AppSettingsDispatch = mapObject(
    DEFAULT_APP_SETTINGS,
    <K extends keyof AppSettings>(property: K) => {
        return {
            [getSettingDispatchName(property)]: () => {
                throw new Error(`Can't set app setting ${property} on default settings object`)
            }
        }
    }
)


/** The React context which specifies the app's settings. */
export const APP_SETTINGS_REACT_CONTEXT = React.createContext<readonly [AppSettings,  AppSettingsDispatch]>(
    [DEFAULT_APP_SETTINGS, DEFAULT_APP_SETTINGS_DISPATCH] as const
);

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
    const [prelabelMode, setPrelabelMode] = useStateSafe<AppSettings["prelabelMode"]>(
        constantInitialiser(DEFAULT_APP_SETTINGS.prelabelMode)
    )

    // Create state for the prelabelMode setting
    const [uploadBulkWherePossible, setUploadBulkWherePossible] = useStateSafe<AppSettings["uploadBulkWherePossible"]>(
        constantInitialiser(DEFAULT_APP_SETTINGS.uploadBulkWherePossible)
    )

    // Create state for the prelabelMode setting
    const [loopJobTemplateDefaults, setLoopJobTemplateDefaults] = useStateSafe<AppSettings["loopJobTemplateDefaults"]>(
        constantInitialiser(DEFAULT_APP_SETTINGS.loopJobTemplateDefaults)
    )

    return [
        {
            prelabelMode,
            uploadBulkWherePossible,
            loopJobTemplateDefaults
        },
        {
            setPrelabelMode,
            setUploadBulkWherePossible,
            setLoopJobTemplateDefaults
        }
    ]
}

export async function saveSettingsToContext(
    settings: AppSettings,
    context: UFDLServerContext
) {
    try {
        await context.store_item(
            "AppSettings",
            JSON.stringify(settings),
            true
        )
    } catch (reason) {
        console.error("Failed to save settings to context", reason)
    }
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
        dispatch.setPrelabelMode(deserialised.prelabelMode)
        dispatch.setUploadBulkWherePossible(deserialised.uploadBulkWherePossible)
        dispatch.setLoopJobTemplateDefaults(deserialised.loopJobTemplateDefaults)
    }

    return deserialised
}
