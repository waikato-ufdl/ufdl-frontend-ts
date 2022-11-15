import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import SelectDatasetPage from "../SelectDatasetPage";
import {FunctionComponentReturnType} from "../../../util/react/types";
import Page from "../Page";
import useTheLoopStateMachine from "./hooks/useTheLoopStateMachine/useTheLoopStateMachine";
import WorkingPage from "./WorkingPage";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import RefineOrDoneModal from "./RefineOrDoneModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {ClassColours} from "../../../server/util/classification";
import JobTemplateSelectModal from "./JobTemplateSelectModal";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template"
import {ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
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


const FRAMEWORK_REGEXP = /^Framework<'(.*)', '(.*)'>$/

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

    const trainConfigureModal = useLocalModal();
    const evalConfigureModal = useLocalModal();

    const [selectableTemplates, setSelectableTemplates] = useStateSafe<JobTemplateInstance[] | undefined>(constantInitialiser(undefined))
    const [trainTemplate, setTrainTemplate] = useStateSafe<number | undefined>(constantInitialiser(undefined))
    const [trainParameters, setTrainParameters] = useStateSafe<{[name: string]: ParameterValue} | undefined>(constantInitialiser(undefined))
    const [framework, setFramework] = useStateSafe<[string, string] | undefined>(constantInitialiser(undefined))
    const [modelType, setModelType] = useStateSafe<string | undefined>(constantInitialiser(undefined))

    const templateControlPK = useDerivedState(
        ([stateMachine, position]) => {
            if (stateMachine.state === "Selecting Prelabel Images") {
                return stateMachine.data.evalTemplatePK
            } else if (stateMachine.state === "Selecting Initial Images") {
                if (position === undefined) {
                    if (stateMachine.data.evalTemplatePK !== undefined) {
                        return stateMachine.data.evalTemplatePK
                    }
                } else if (stateMachine.data.trainTemplatePK !== undefined) {
                    return stateMachine.data.trainTemplatePK
                }
            }
            return UNCONTROLLED_RESET
        },
        [stateMachine, trainConfigureModal.position] as const
    )

    const templateControl = useDerivedState(
        ([templateControlPK]) => templateControlPK === UNCONTROLLED_RESET?
            UNCONTROLLED_RESET
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
                onDatasetSelected={stateMachine.transitions.setSelected}
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
                    onNext={trainConfigureModal.show}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                    modelType={undefined}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please select the initial set of images to train against"}
                    ExtraControls={HomeButton}
                />
                <JobTemplateSelectModal
                    onDone={
                        async (template_pk, parameter_values) => {
                            const position = trainConfigureModal.position;
                            if (position === undefined) return;
                            trainConfigureModal.hide()
                            setTrainTemplate(template_pk);
                            setTrainParameters(parameter_values);
                            try {
                                const outputs = await job_template.get_outputs(ufdlServerContext, template_pk)

                                const modelOutputType = outputs["model"];

                                setModelType(modelOutputType);

                                const matchingTemplates = await job_template.get_all_matching_templates(
                                    ufdlServerContext,
                                    "Predict",
                                    {model: `JobOutput<${modelOutputType}>`}
                                )

                                setSelectableTemplates(matchingTemplates);

                                evalConfigureModal.show(...position);
                            } catch (e) {
                                stateMachine.transitions.error(e)
                            }

                            try {
                                const types = await job_template.get_types(ufdlServerContext, template_pk)

                                console.log("TYPES", types)
                                const frameworkType = types["FrameworkType"]
                                if (frameworkType === undefined) {
                                    console.log("Couldn't get FrameworkType")
                                    return;
                                }
                                const framework = frameworkType.match(FRAMEWORK_REGEXP);
                                if (framework === null) {
                                    console.log(`Couldn't parse FrameworkType ${frameworkType}`)
                                    return;
                                }
                                console.log("FRAMEWORK", framework, framework[1], framework[2])
                                setFramework([framework[1], framework[2]])
                            } catch (e) {
                                stateMachine.transitions.error(e)
                            }
                        }
                    }
                    templates={selectableTemplates === undefined ? [] : selectableTemplates}
                    templatePK={templateControl}
                    initialValues={stateMachine.data.trainParameters ?? {}}
                    position={trainConfigureModal.position}
                    onCancel={() => trainConfigureModal.hide()}
                />
                <JobTemplateSelectModal
                    onDone={(template_pk, parameter_values) => {
                        evalConfigureModal.hide()
                        if (trainTemplate === undefined) return;
                        if (trainParameters === undefined) return;
                        if (framework === undefined) return;
                        if (modelType === undefined) return;
                        stateMachine.transitions.trainInitialModel(
                            trainTemplate,
                            trainParameters,
                            template_pk,
                            parameter_values,
                            framework,
                            modelType
                        )
                    }}
                    templates={selectableTemplates === undefined ? [] : selectableTemplates}
                    templatePK={templateControl}
                    initialValues={stateMachine.data.evalParameters ?? {}}
                    position={evalConfigureModal.position}
                    onCancel={() => evalConfigureModal.hide()}
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
                    nextLabel={"Prelabel"}
                    contract={"Predict"}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    onNext={evalConfigureModal.show}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                    modelType={stateMachine.data.modelType}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please select additional images to add to the dataset"}
                    ExtraControls={HomeButton}
                />
                <JobTemplateSelectModal
                    onDone={(template_pk, parameter_values) => {
                        evalConfigureModal.hide()
                        stateMachine.transitions.prelabel(template_pk, parameter_values);
                    }}
                    templates={selectableTemplates === undefined ? [] : selectableTemplates}
                    templatePK={templateControl}
                    initialValues={stateMachine.data.evalParameters}
                    position={evalConfigureModal.position}
                    onCancel={() => evalConfigureModal.hide()}
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
                    evalQueryDependencies={["Checking"]}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please check if the model's accuracy is sufficient"}
                    ExtraControls={HomeButton}
                />
                <RefineOrDoneModal
                    onRefine={() => {refineOrDoneModal.hide(); stateMachine.transitions.finishChecking(appSettings.prelabelMode === "None" ? "Edit" : "Prelabel")}}
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
                queryDependencies={["User Fixing Categories"]}
                mode={
                    appSettings.prelabelMode === "None" || appSettings.prelabelMode === "Default"
                        ? DEFAULT
                        : appSettings.prelabelMode
                }
                selectedSortOrder={"random"}
                sortOrderLocked
                heading={"Please check and correct the pre-annotated items"}
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
