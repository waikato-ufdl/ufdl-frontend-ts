import {FunctionComponentReturnType} from "../../util/react/types";
import Page from "./Page";
import {APP_SETTINGS_REACT_CONTEXT, AppSettings} from "../../useAppSettings";
import InterlatchedCheckboxes from "../../util/react/component/InterlatchedCheckboxes";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {identity} from "../../util/identity";
import {useContext} from "react";
import {BackButton} from "../../util/react/component/BackButton";

export type SettingsPageProps = {
    onBack?: () => void
}

const PRELABEL_MODES = ['Default', 'None', 'Single', 'Multi'] as const

export default function SettingsPage(
    props: SettingsPageProps
): FunctionComponentReturnType {

    const [settings, settingsDispatch] = useContext(APP_SETTINGS_REACT_CONTEXT)

    const changeMode = useDerivedState(
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
                onChanged={changeMode}
            />
        </label>

    </Page>
}