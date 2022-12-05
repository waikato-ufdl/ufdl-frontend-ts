import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import SelectDatasetPage from "../SelectDatasetPage";
import {FunctionComponentReturnType} from "../../../util/react/types/FunctionComponentReturnType";
import Page from "../Page";
import useTheLoopStateMachine from "./hooks/useTheLoopStateMachine/useTheLoopStateMachine";
import WorkingPage from "./WorkingPage";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import RefineOrDoneModal from "./RefineOrDoneModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {ClassColours} from "../../../server/util/classification";
import JobTemplateSelectModal from "./JobTemplateSelectModal";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";
import LoopAnnotatorPage from "./LoopAnnotatorPage";
import {isAllowedStateAndData} from "../../../util/react/hooks/useStateMachine/isAllowedState";
import {
    UNCONTROLLED_KEEP,
    UNCONTROLLED_RESET,
    UncontrolledResetOverride
} from "../../../util/react/hooks/useControllableState";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {APP_SETTINGS_REACT_CONTEXT} from "../../../useAppSettings";
import {DEFAULT} from "../../../util/typescript/default";
import TrainPredictTemplateSelectModal from "./TrainPredictTemplateSelectModal";

export type TheLoopPageProps = {
    onBack?: () => void
}

export default function TheLoopPage(
    props: TheLoopPageProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [appSettings] = useContext(APP_SETTINGS_REACT_CONTEXT);

    const stateMachine = useTheLoopStateMachine(ufdlServerContext);

    const [classColours, setClassColours] = useStateSafe<ClassColours | undefined>(constantInitialiser(undefined));

    const refineOrDoneModal = useLocalModal();

    const templateConfigurationModal = useLocalModal();

    const [selectableTemplates, setSelectableTemplates] = useStateSafe<JobTemplateInstance[] | undefined>(constantInitialiser(undefined))

    const templateControlPK = useDerivedState(
        ([stateMachine]) => {
            if (stateMachine.state === "Selecting Prelabel Images") {
                return stateMachine.data.evalTemplatePK
            } else if (stateMachine.state === "Selecting Initial Images") {
                if (stateMachine.data.trainTemplatePK !== undefined) {
                    return stateMachine.data.trainTemplatePK
                }
            }
            return UNCONTROLLED_RESET
        },
        [stateMachine] as const
    )

    const templateControl = useDerivedState(
        ([templateControlPK]) => templateControlPK === UNCONTROLLED_RESET
            ? UNCONTROLLED_RESET
            : new UncontrolledResetOverride(templateControlPK)
        ,
        [templateControlPK] as const
    )

    const HomeButton = useDerivedState(
        ([onBack]) => () => {
            return <button className={"HomeButton"} onClick={onBack}>
                Home
            </button>
        },
        [props.onBack] as const
    )

    switch (stateMachine.state) {
        case "Initial":
            return <div />
        case "Selecting Primary Dataset":
            return <SelectDatasetPage
                onDatasetSelected={(pk, domain) => stateMachine.transitions.setSelected(pk, domain, appSettings)}
                onProjectSelected={stateMachine.transitions.setSelected}
                onTeamSelected={stateMachine.transitions.setSelected}
                from={stateMachine.data.from}
                lock={"project"}
                onBack={stateMachine.data.from === undefined ? props.onBack : stateMachine.transitions.back}
            />;

        case "Selecting Initial Images": {
            return <>
                <LoopAnnotatorPage
                    key={stateMachine.state}
                    domain={stateMachine.data.domain}
                    targetDataset={stateMachine.data.targetDataset}
                    evalDatasetPK={undefined}
                    nextLabel={"Train"}
                    contract={"Train"}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    onNext={templateConfigurationModal.show}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                    modelType={undefined}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please select the initial set of images to train against"}
                    ExtraControls={HomeButton}
                />
                <TrainPredictTemplateSelectModal
                    ufdlServerContext={ufdlServerContext}
                    selectableTrainTemplates={selectableTemplates}
                    trainTemplatePK={templateControl}
                    initialTrainParameterValues={stateMachine.data.trainParameters}
                    onPredictTemplatesDetermined={(templates) => {
                        if (stateMachine.data.evalTemplatePK === undefined) return undefined
                        if (templates.map(template => template.pk).findIndex(pk => pk === stateMachine.data.evalTemplatePK) === -1) return undefined
                        return [stateMachine.data.evalTemplatePK, stateMachine.data.evalParameters ?? {}]
                    }}
                    onDone={stateMachine.transitions.trainInitialModel}
                    onError={stateMachine.transitions.error}
                    position={templateConfigurationModal.position}
                    onCancel={templateConfigurationModal.hide}
                />
            </>;
        }

        case "Selecting Prelabel Images":
            return <>
                <LoopAnnotatorPage
                    key={stateMachine.state}
                    domain={stateMachine.data.domain}
                    targetDataset={stateMachine.data.targetDataset}
                    evalDatasetPK={undefined}
                    nextLabel={appSettings.prelabelMode === "None" ? "Label" : "Prelabel"}
                    contract={"Predict"}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    onNext={appSettings.prelabelMode === "None" ? stateMachine.transitions.label : templateConfigurationModal.show}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                    modelType={stateMachine.data.modelType}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please select additional images to add to the dataset"}
                    ExtraControls={HomeButton}
                />
                <JobTemplateSelectModal
                    onDone={(template_pk, parameter_values) => {
                        templateConfigurationModal.hide()
                        stateMachine.transitions.prelabel(template_pk, parameter_values);
                    }}
                    templates={selectableTemplates === undefined ? [] : selectableTemplates}
                    templatePK={templateControl}
                    initialValues={stateMachine.data.evalParameters}
                    position={templateConfigurationModal.position}
                    onCancel={() => templateConfigurationModal.hide()}
                />
            </>;

        case "Creating Evaluate Job":
        case "Creating Train Job":
        case "Creating Prelabel Job":
        case "Merging Additional Images":
        case "Training":
        case "Evaluating":
        case "Prelabel":
            const progress = isAllowedStateAndData(
                stateMachine,
                "Training",
                "Evaluating",
                "Prelabel"
            ) ?
                stateMachine.data.progress
                : 0.0

            const onCancel = isAllowedStateAndData(
                stateMachine,
                "Training",
                "Evaluating",
                "Prelabel",
                "Merging Additional Images"
            ) ?
                stateMachine.transitions.cancel
                : () => undefined

            return <WorkingPage
                key={stateMachine.state} // Reset internal state on state-machine transition
                title={stateMachine.state}
                progress={progress}
                onCancel={onCancel}
            />;

        case "Checking":
            return <>
                <LoopAnnotatorPage
                    key={stateMachine.state}
                    domain={stateMachine.data.domain}
                    targetDataset={stateMachine.data.evaluationDataset}
                    evalDatasetPK={stateMachine.data.primaryDataset}
                    nextLabel={"Cycle"}
                    contract={undefined}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    onNext={refineOrDoneModal.show}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                    modelType={stateMachine.data.modelType}
                    evalQueryDependencies={{annotations: ["Checking"], onlyFetched: false}}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please check if the model's accuracy is sufficient"}
                    ExtraControls={HomeButton}
                />
                <RefineOrDoneModal
                    onRefine={() => {refineOrDoneModal.hide(); stateMachine.transitions.finishChecking("Prelabel")}}
                    onDone={() => {refineOrDoneModal.hide(); stateMachine.transitions.finishChecking("Finished")}}
                    position={refineOrDoneModal.position}
                    onCancel={() => refineOrDoneModal.hide()}
                />
            </>;

        case "Creating Addition Dataset":
            return <Page>
                {stateMachine.state}
            </Page>;

        case "User Fixing Categories":
            return <LoopAnnotatorPage
                key={stateMachine.state}
                domain={stateMachine.data.domain}
                targetDataset={stateMachine.data.additionDataset}
                evalDatasetPK={stateMachine.data.primaryDataset}
                nextLabel={"Accept"}
                contract={undefined}
                classColours={classColours}
                setClassColours={setClassColours}
                context={ufdlServerContext}
                setSelectableTemplates={() => {}}
                onNext={stateMachine.transitions.finishedFixing}
                onBack={stateMachine.transitions.back}
                onError={stateMachine.transitions.error}
                modelType={stateMachine.data.modelType}
                queryDependencies={
                    appSettings.prelabelMode === "None"
                        ? undefined
                        : {annotations: ["User Fixing Categories"], onlyFetched: false}
                }
                mode={
                    appSettings.prelabelMode === "Default"
                        ? DEFAULT
                        : appSettings.prelabelMode === "None"
                            ? "Single"
                            : appSettings.prelabelMode
                }
                selectedSortOrder={"random"}
                sortOrderLocked
                heading={
                    appSettings.prelabelMode === "None"
                        ? "Please annotate the items"
                        : "Please check and correct the pre-annotated items"
                }
                ExtraControls={HomeButton}
            />

        case "Finished":
            return <Page>
                {"Finished!"}
                <button onClick={stateMachine.transitions.download}>Download</button>
                <button
                    onClick={() => {
                        stateMachine.transitions.reset();
                        if (props.onBack !== undefined) props.onBack();
                    }}
                >
                    Back
                </button>
            </Page>;

        case "Error":
            return <Page>
                {"Error"}
                {String(stateMachine.data.reason)}
                <button onClick={stateMachine.transitions.reset}>Back</button>
            </Page>


    }
}
