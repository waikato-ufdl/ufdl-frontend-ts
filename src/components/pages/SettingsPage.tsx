import {FunctionComponentReturnType} from "../../util/react/types";
import Page from "./Page";
import {APP_SETTINGS_REACT_CONTEXT, AppSettings, saveSettingsToContext} from "../../useAppSettings";
import InterlatchedCheckboxes from "../../util/react/component/InterlatchedCheckboxes";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {identity} from "../../util/identity";
import {useContext} from "react";
import {BackButton} from "../../util/react/component/BackButton";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";

export type SettingsPageProps = {
    onBack?: () => void
}

const PRELABEL_MODES = ['Default', 'None', 'Single', 'Multi'] as const

export default function SettingsPage(
    props: SettingsPageProps
): FunctionComponentReturnType {

    const [settings, settingsDispatch] = useContext(APP_SETTINGS_REACT_CONTEXT)

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT)

    const setPrelabelMode = useDerivedState(
        ([onModeChanged]) => (mode: AppSettings['prelabelMode'] | undefined) => {
            onModeChanged(mode ?? 'Default')
        },
        [settingsDispatch.setPrelabelMode] as const
    )

    return <Page className={"SettingsPage"}>
        <BackButton onBack={props.onBack} />
        <label>
            Prelabel Mode:
            <InterlatchedCheckboxes
                options={PRELABEL_MODES}
                labelExtractor={identity}
                canSelectNone={true}
                selected={PRELABEL_MODES.indexOf(settings.prelabelMode)}
                onChanged={setPrelabelMode}
            />
        </label>
        <button
            className={"SaveButton"}
            onClick={
                () => saveSettingsToContext(settings, ufdlServerContext)
            }
        >
            Save
        </button>

    </Page>
}