import {FunctionComponentReturnType} from "../../util/react/types";
import Page from "./Page";
import {APP_SETTINGS_REACT_CONTEXT, AppSettings, saveSettingsToContext} from "../../useAppSettings";
import InterlatchedCheckboxes from "../../util/react/component/InterlatchedCheckboxes";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {identity} from "../../util/identity";
import React, {useContext} from "react";
import {BackButton} from "../../util/react/component/BackButton";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import useLocalModal from "../../util/react/hooks/useLocalModal";
import TrainPredictTemplateSelectModal from "./loop/TrainPredictTemplateSelectModal";
import getContractTemplates from "./loop/jobs/getContractTemplates";
import {DomainName} from "../../server/domains";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {JobTemplateInstance} from "../../../../ufdl-ts-client/dist/types/core/jobs/job_template";
import {UNCONTROLLED_KEEP, UncontrolledResetOverride} from "../../util/react/hooks/useControllableState";
import {anyToString} from "../../util/typescript/strings/anyToString";

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

    const templateConfigureModal = useLocalModal();

    const [domain, setDomain] = useStateSafe<DomainName>(() => "Image Classification")
    const [trainTemplates, setTrainTemplates] = useStateSafe<JobTemplateInstance[]>(() => [])

    async function configureLoopTemplateDefaults(domain: DomainName, event: React.MouseEvent) {
        const templates = await getContractTemplates(
            ufdlServerContext,
            domain,
            "Train"
        )

        setDomain(domain)
        setTrainTemplates(templates)

        templateConfigureModal.onClick(event)
    }

    const trainTemplatePK = useDerivedState(
        ([train]) => train === undefined
            ? UNCONTROLLED_KEEP
            : new UncontrolledResetOverride(train.templatePK),
        [settings.loopJobTemplateDefaults[domain].train] as const
    )

    return <Page className={"SettingsPage"}>
        <BackButton onBack={props.onBack} />
        <div>
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
        </div>
        <div>
            <label>
                Upload in bulk where possible:
                <input
                    type={"checkbox"}
                    checked={settings.uploadBulkWherePossible}
                    onClick={() => settingsDispatch.setUploadBulkWherePossible(!settings.uploadBulkWherePossible)}
                />
            </label>
        </div>
        <div>
            <button
                onClick={event => configureLoopTemplateDefaults("Image Classification", event)}
            >
                Set Image Classification Loop Template Defaults
            </button>
            <button
                onClick={event => configureLoopTemplateDefaults("Object Detection", event)}
            >
                Set Object Detection Loop Template Defaults
            </button>
            <button
                onClick={event => configureLoopTemplateDefaults("Image Segmentation", event)}
            >
                Set Image Segmentation Loop Template Defaults
            </button>
            <button
                onClick={event => configureLoopTemplateDefaults("Speech", event)}
            >
                Set Speech Loop Template Defaults
            </button>
            <TrainPredictTemplateSelectModal
                key={domain + anyToString(templateConfigureModal.hidden)}
                ufdlServerContext={ufdlServerContext}
                selectableTrainTemplates={trainTemplates}
                trainTemplatePK={trainTemplatePK}
                initialTrainParameterValues={settings.loopJobTemplateDefaults[domain].train?.parameters}
                onDone={(
                    trainTemplatePK,
                    trainParameterValues,
                    predictTemplatePK,
                    predictParameterValues
                ) => {
                    const current = settings.loopJobTemplateDefaults

                    settingsDispatch.setLoopJobTemplateDefaults(
                        {
                            ...current,
                            [domain]: {
                                train: {
                                    templatePK: trainTemplatePK,
                                    parameters: trainParameterValues
                                },
                                predict: {
                                    templatePK: predictTemplatePK,
                                    parameters: predictParameterValues
                                }
                            }
                        }
                    )

                    templateConfigureModal.hide()
                }}
                position={templateConfigureModal.position}
                onCancel={templateConfigureModal.hide}
            />
        </div>
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