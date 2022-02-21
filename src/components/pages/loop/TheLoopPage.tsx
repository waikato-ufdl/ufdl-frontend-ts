import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import SelectDatasetPage from "../SelectDatasetPage";
import {FunctionComponentReturnType} from "../../../util/react/types";
import ImageClassificationAnnotatorPage from "../annotation/icap/ImageClassificationAnnotatorPage";
import Page from "../Page";
import useTheLoopStateMachine from "./hooks/useTheLoopStateMachine/useTheLoopStateMachine";
import WorkingPage from "./WorkingPage";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import RefineOrDoneModal from "./RefineOrDoneModal";
import tryGetBehaviourSubjectValue from "../../../util/rx/tryGetBehaviourSubjectValue";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {ClassColours} from "../../../server/util/classification";
import SelectTemplateModal from "./SelectTemplateModal";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template"
import {ParameterValue} from "../../../../../ufdl-ts-client/dist/json/generated/CreateJobSpec";
import LoopAnnotatorPage from "./LoopAnnotatorPage";


const FRAMEWORK_REGEXP = /^Framework<'(.*)', '(.*)'>$/

export type TheLoopPageProps = {
    onBack?: () => void
}

export default function TheLoopPage(
    props: TheLoopPageProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

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

    switch (stateMachine.state) {
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
                    domain={stateMachine.data.domain}
                    targetDataset={stateMachine.data.targetDataset}
                    evalDatasetPK={undefined}
                    nextLabel={"Train"}
                    contract={"Train"}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    templateModal={trainConfigureModal}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                />
                <SelectTemplateModal
                    onDone={(template_pk, parameter_values) => {
                        const position = trainConfigureModal.position;
                        if (position === undefined) return;
                        trainConfigureModal.hide()
                        setTrainTemplate(template_pk);
                        setTrainParameters(parameter_values);
                        job_template.get_outputs(
                            ufdlServerContext,
                            template_pk
                        ).then(
                            async (outputs) => {
                                try {
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
                            }
                        ).catch(stateMachine.transitions.error)

                        job_template.get_types(
                            ufdlServerContext,
                            template_pk
                        ).then(
                            async (types) => {
                                try {
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
                        ).catch(stateMachine.transitions.error)

                    }}
                    templates={selectableTemplates === undefined ? [] : selectableTemplates}
                    position={trainConfigureModal.position}
                    onCancel={() => trainConfigureModal.hide()}
                />
                <SelectTemplateModal
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
                    position={evalConfigureModal.position}
                    onCancel={() => evalConfigureModal.hide()}
                />
            </>;
        }

        case "Selecting Prelabel Images":
            return <>
                <LoopAnnotatorPage
                    domain={stateMachine.data.domain}
                    targetDataset={stateMachine.data.targetDataset}
                    evalDatasetPK={undefined}
                    nextLabel={"Prelabel"}
                    contract={"Predict"}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    templateModal={evalConfigureModal}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                />
                <SelectTemplateModal
                    onDone={(template_pk, parameter_values) => {
                        evalConfigureModal.hide()
                        stateMachine.transitions.prelabel(template_pk, parameter_values);
                    }}
                    templates={selectableTemplates === undefined ? [] : selectableTemplates}
                    position={evalConfigureModal.position}
                    onCancel={() => evalConfigureModal.hide()}
                />
            </>;

        case "Merging Additional Images":
        case "Training":
        case "Evaluating":
        case "Prelabel":
            let progress = stateMachine.state === "Merging Additional Images" ?
                    0.0 :
                    tryGetBehaviourSubjectValue(
                        stateMachine.data.progress,
                        constantInitialiser(0.0)
                    );

            return <WorkingPage
                title={stateMachine.state}
                progress={progress}
                onCancel={stateMachine.transitions.cancel}
            />;

        case "Checking":
            return <>
                <LoopAnnotatorPage
                    domain={stateMachine.data.domain}
                    targetDataset={stateMachine.data.evaluationDataset}
                    evalDatasetPK={stateMachine.data.primaryDataset}
                    nextLabel={"Cycle"}
                    contract={undefined}
                    classColours={classColours}
                    setClassColours={setClassColours}
                    context={ufdlServerContext}
                    setSelectableTemplates={setSelectableTemplates}
                    templateModal={refineOrDoneModal}
                    onBack={stateMachine.transitions.back}
                    onError={stateMachine.transitions.error}
                />
                <RefineOrDoneModal
                    onRefine={() => {refineOrDoneModal.hide(); stateMachine.transitions.goodEnough(false)}}
                    onDone={() => {refineOrDoneModal.hide(); stateMachine.transitions.goodEnough(true)}}
                    position={refineOrDoneModal.position}
                    onCancel={() => refineOrDoneModal.hide()}
                />
            </>;

        case "Creating Addition Dataset":
            return <Page>
                {`${stateMachine.state}`}
            </Page>;

        case "User Fixing Categories":
            return <ImageClassificationAnnotatorPage
                lockedPK={stateMachine.data.additionDataset}
                initialColours={classColours}
                nextLabel={"Accept"}
                onNext={(_, __, labelColours) => {
                    setClassColours(labelColours);
                    stateMachine.transitions.finishedFixing();
                }}
                onBack={stateMachine.transitions.back}
            />;

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
