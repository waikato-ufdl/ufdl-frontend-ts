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
import pass from "../../../util/typescript/functions/pass";
import {
    CLASS_COLOURS,
    EXPERIMENT_MAX_ITERATION,
    getPrelabelMode,
    QUESTION_1_OPTIONS,
    questionnaire_is_complete
} from "../../../EXPERIMENT";
import InterlatchedCheckboxes from "../../../util/react/component/InterlatchedCheckboxes";
import {identity} from "../../../util/identity";
import {InterfaceSection} from "./InterfaceSection";
import {Section3To8TextArea} from "./Section3To8TextArea";
import "./TheLoopPage.css"

export type TheLoopPageProps = {
    onBack?: () => void
}

export default function TheLoopPage(
    props: TheLoopPageProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [appSettings] = useContext(APP_SETTINGS_REACT_CONTEXT);

    const stateMachine = useTheLoopStateMachine(ufdlServerContext);

    const [classColours, setClassColours] = useStateSafe<ClassColours | undefined>(constantInitialiser(CLASS_COLOURS));

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

    switch (stateMachine.state) {
        case "Initial":
            return <WorkingPage
                title={"Initialising..."}
                progress={0.0}
            />

        case "Agreement Page":
            return <div className={"Agreement"}>
                <div className={"Logo"}>UFDL</div>
                <div className={"Info"}>
                    <span>
                        Thank you for taking part in this user study.<br/>
                        Please click 'I Agree' below to indicate that you have read and<br/>
                        understood the participant information for this study (sent to you by<br/>
                        email) and you agree to take part under the conditions described.
                    </span>
                </div>
                <button onClick={stateMachine.transitions.agree}>
                    I Agree
                </button>
            </div>

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
                    onClassChanged={pass}
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
                    nextLabel={""}
                    contract={"Predict"}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    onNext={pass}
                    onBack={pass}
                    onError={stateMachine.transitions.error}
                    modelType={stateMachine.data.modelType}
                    selectedSortOrder={UNCONTROLLED_KEEP}
                    heading={"Please select additional images to add to the dataset"}
                    onClassChanged={pass}
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
                    onClassChanged={pass}
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
            const prelabelMode = getPrelabelMode(stateMachine.data.iteration, stateMachine.data.participantNumber % 6)
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
                onBack={pass}
                onError={stateMachine.transitions.error}
                modelType={stateMachine.data.modelType}
                queryDependencies={
                    prelabelMode === "None"
                        ? undefined
                        : {annotations: ["User Fixing Categories"], onlyFetched: false}
                }
                evalQueryDependencies={
                    prelabelMode === "Multi" || prelabelMode === "Example"
                        ? {
                            dataset: ["User Fixing Categories"],
                            fileData: ["User Fixing Categories"],
                            annotations: ["User Fixing Categories"],
                            onlyFetched: false
                        }
                        : undefined
                }
                mode={
                    prelabelMode === "Default"
                        ? DEFAULT
                        : prelabelMode === "None"
                            ? "Single"
                            : prelabelMode
                }
                selectedSortOrder={"random"}
                sortOrderLocked
                heading={
                    prelabelMode === "None"
                        ? `[Iteration ${stateMachine.data.iteration}/${EXPERIMENT_MAX_ITERATION}] Please annotate the items and then click -> `
                        : `[Iteration ${stateMachine.data.iteration}/${EXPERIMENT_MAX_ITERATION}] Please check and correct the pre-annotated items and then click -> `
                }
                onClassChanged={stateMachine.transitions.addLabelChangedEvent}
            />

        case "Questionnaire":

            return <div>
                <section>
                    <label>1.</label>
                    <span>
                        How would you rate your knowledge of dog breeds, and ability to identify them, with<br/>
                        particular reference to the breeds you’ve been exposed to today?
                    </span>
                    <InterlatchedCheckboxes
                        options={QUESTION_1_OPTIONS}
                        labelExtractor={identity}
                        canSelectNone
                        selected={stateMachine.data.questionnaire["1"] === undefined ? -1 : QUESTION_1_OPTIONS.indexOf(stateMachine.data.questionnaire["1"])}
                        onChanged={
                            (option) => stateMachine.transitions.update(
                                {
                                    ...stateMachine.data.questionnaire,
                                    1: option
                                }
                            )
                        }
                    />
                </section>
                <section>
                    <label>2.</label>
                    <span>
                        Of the three interfaces you used, can you rank them 1 to 3, with 1 the interface you<br/>
                        found easiest or most helpful, and 3 the interface you found most difficult and<br/>
                        unhelpful, and then also answer the other questions relating to each interface:<br/>
                    </span>
                    <InterfaceSection
                        index={0}
                        participantNumber={stateMachine.data.participantNumber}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                    <InterfaceSection
                        index={1}
                        participantNumber={stateMachine.data.participantNumber}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                    <InterfaceSection
                        index={2}
                        participantNumber={stateMachine.data.participantNumber}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <section>
                    <label>3.</label>
                    <span>
                        What are your thoughts on the general design of the website? You could comment on<br/>
                        issues such as colours, styles, fonts, layouts, and responsiveness.<br/>
                    </span>
                    <Section3To8TextArea
                        section={3}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <section>
                    <label>4.</label>
                    <span>
                        How did the general design of the user interface affect your ability to label the dogs, and<br/>
                        did that overall design have a different impact for the different interfaces?<br/>
                    </span>
                    <Section3To8TextArea
                        section={4}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <section>
                    <label>5.</label>
                    <span>
                        Did the supporting example images make it easier or harder in the case of interface C?.<br/>
                    </span>
                    <Section3To8TextArea
                        section={5}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <section>
                    <label>6.</label>
                    <span>
                        How clear did you find the instructions you received?<br/>
                    </span>
                    <Section3To8TextArea
                        section={6}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <section>
                    <label>7.</label>
                    <span>
                        Which interface do you think you were most successful with for correctly labelling the<br/>
                        dogs? Why?<br/>
                    </span>
                    <Section3To8TextArea
                        section={7}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <section>
                    <label>8.</label>
                    <span>
                        Which interface do you think you were least successful with for correctly labelling the<br/>
                        dogs? Why?<br/>
                    </span>
                    <Section3To8TextArea
                        section={8}
                        questionnaire={stateMachine.data.questionnaire}
                        update={stateMachine.transitions.update}
                    />
                </section>
                <button
                    onClick={() => {
                        const questionnaire = stateMachine.data.questionnaire
                        if (!questionnaire_is_complete(questionnaire)) return
                        stateMachine.transitions.submit(questionnaire)
                    }}
                    disabled={!questionnaire_is_complete(stateMachine.data.questionnaire)}
                >
                    Submit
                </button>
            </div>

        case "Finished":
            return <Page>
                {"Finished! Please close the browser."}
            </Page>;

        case "Error":
            return <Page>
                {"Error"}
                {String(stateMachine.data.reason)}
                <button onClick={stateMachine.transitions.reset}>Back</button>
            </Page>


    }
}
