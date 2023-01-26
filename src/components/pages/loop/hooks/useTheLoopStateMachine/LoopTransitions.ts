import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {createNewLoopState} from "./createNewLoopState";
import {
    createErrorResponseTransitionHandler,
    createErrorState,
    HANDLED_ERROR_RESPONSE,
    tryTransitionToErrorState
} from "./errorTransition";
import evaluate from "../../jobs/evaluate";
import {AUTOMATIC} from "../../../../../util/react/hooks/useStateMachine/AUTOMATIC";
import train from "../../jobs/train";
import copyDataset from "../../jobs/copyDataset";
import merge from "../../jobs/merge";
import getModelOutputPK from "../../jobs/getModelOutputPK";
import downloadModel from "../../jobs/downloadModel";
import {LoopStateAndData, LoopStateTransition} from "./types";
import {Dispatch} from "react";
import hasStateChanged from "../../../../../util/react/hooks/useStateMachine/hasStateChanged";
import {silentlyCancelJob} from "./silentlyCancelJob";
import cancelJobTransition from "./cancelJobTransition";
import completionPromise from "../../../../../util/rx/completionPromise";
import {CANCELLED} from "../../../../../server/websocket/observeJobTransitionsViaWebSocket";
import {DomainName} from "../../../../../server/domains";
import {formatResponseError} from "../../../../../server/util/responseError";
import {ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {restoreLoopState, trySaveLoopState} from "./save";
import loopStateDataConstructor from "./loopStateDataConstructor";
import {AppSettings, DEFAULT_APP_SETTINGS} from "../../../../../useAppSettings";
import * as team from "ufdl-ts-client/functional/core/team"
import * as project from "ufdl-ts-client/functional/core/project"
import {exactFilter} from "../../../../../server/util/exactFilter";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset"
import {NO_ANNOTATION, OptionalAnnotations} from "../../../../../server/types/annotations";
import {
    addIterationFilesToDataset, correctIterationLabels,
    EXPERIMENT_DATASET_NAME, EXPERIMENT_MAX_ITERATION,
    EXPERIMENT_PROJECT_NAME,
    EXPERIMENT_TEAM_NAME,
    getPrelabelMode
} from "../../../../../EXPERIMENT";

export const LOOP_TRANSITIONS = {
    "Initial": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Initial">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const context = current.data.context

            const previousLoopState = restoreLoopState(context)

            if (previousLoopState !== undefined) {
                changeState(
                    (newCurrent) => {
                        if (newCurrent !== current) return;

                        return previousLoopState;
                    }
                )
            } else {
                const teams = await team.list(context)
                const teamIndex = teams.findIndex(team => team.name === EXPERIMENT_TEAM_NAME)
                const teamPK = teamIndex === -1
                    ? (await team.create(context, EXPERIMENT_TEAM_NAME)).pk
                    : teams[teamIndex].pk

                const projects = await project.list(context, exactFilter("team", teamPK))
                const projectIndex = projects.findIndex(project => project.name === EXPERIMENT_PROJECT_NAME)
                const projectPK = projectIndex === -1
                    ? (await project.create(context, EXPERIMENT_PROJECT_NAME, teamPK)).pk
                    : projects[projectIndex].pk

                const datasets = await ICDataset.list(context, exactFilter("project", projectPK))
                const datasetIndex = projects.findIndex(dataset => dataset.name === EXPERIMENT_DATASET_NAME)
                const datasetPK = datasetIndex === -1
                    ? (await ICDataset.create(context, EXPERIMENT_DATASET_NAME, projectPK, 1)).pk
                    : datasets[datasetIndex].pk

                const primaryDataset = (new TeamPK(teamPK)).project(projectPK).dataset(datasetPK)
                const domain = "Image Classification"

                const trainTemplatePK = DEFAULT_APP_SETTINGS.loopJobTemplateDefaults["Image Classification"].train.templatePK
                const trainParameters = DEFAULT_APP_SETTINGS.loopJobTemplateDefaults["Image Classification"].train.parameters
                const evalTemplatePK = DEFAULT_APP_SETTINGS.loopJobTemplateDefaults["Image Classification"].predict.templatePK
                const evalParameters = DEFAULT_APP_SETTINGS.loopJobTemplateDefaults["Image Classification"].predict.parameters

                const participantNumber = Number.parseInt(
                    (
                        await (
                            await context.get(
                                `v1/html/extra/participantNumber`,
                                false
                            )
                        ).text()
                    ).trim()
                )

                await addIterationFilesToDataset(
                    context,
                    datasetPK,
                    0,
                    false
                )

                const date = new Date()

                const [jobPK, progress] = train(
                    context,
                    primaryDataset,
                    trainTemplatePK,
                    {
                        ...trainParameters,
                        frontend_metadata: {
                            type: "JSON",
                            value: {
                                loop_state: "Initial",
                                time: date.toString(),
                                timeMS: date.getTime(),
                                iteration: 0,
                                participantNumber,
                                user: context.username,
                                host: context.host,
                                teamPK,
                                projectPK,
                                datasetPK,
                            }
                        }
                    },
                    domain
                );

                changeState(
                    (newCurrent) => {
                        if (newCurrent !== current) return;

                        const newState = loopStateDataConstructor("Creating Train Job")(
                            {
                                context,
                                participantNumber,
                                primaryDataset,
                                domain,
                                trainTemplatePK,
                                trainParameters,
                                evalTemplatePK,
                                evalParameters,
                                jobPK,
                                progress,
                                framework: ["dogs_dummy", "1"],
                                modelType: "Model<Domain<'Image Classification'>, Framework<'dogs_dummy', '1'>>",
                                iteration: 0
                            }
                        )
                        trySaveLoopState(newState)
                        return newState

                    }
                )
            }
        }
    },
    "Selecting Primary Dataset": {
        setSelected(selection?: DatasetPK | ProjectPK | TeamPK, domain?: DomainName, settings?: AppSettings) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Primary Dataset") return;

                if (selection instanceof DatasetPK) {
                    if (domain === undefined) return;
                    return createNewLoopState("Selecting Initial Images")(
                        {
                            ...current.data,
                            primaryDataset: selection,
                            targetDataset: selection,
                            domain: domain,
                            trainTemplatePK: settings?.loopJobTemplateDefaults[domain].train?.templatePK,
                            trainParameters: settings?.loopJobTemplateDefaults[domain].train?.parameters,
                            evalTemplatePK: settings?.loopJobTemplateDefaults[domain].predict?.templatePK,
                            evalParameters: settings?.loopJobTemplateDefaults[domain].predict?.parameters
                        }
                    );
                } else {
                    return createNewLoopState("Selecting Primary Dataset")(
                        {
                            ...current.data,
                            from: selection
                        }
                    )
                }
            }
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Primary Dataset") return;

                return createNewLoopState("Selecting Primary Dataset")(
                    {
                        ...current.data,
                        from: current.data.from instanceof ProjectPK ? current.data.from.team : undefined
                    }
                )
            }
        }
    },
    "Selecting Initial Images": {
        trainInitialModel(
            trainTemplatePK: number,
            trainParameters: { [parameter_name: string]: ParameterValue},
            evalTemplatePK: number,
            evalParameters: { [parameter_name: string]: ParameterValue},
            framework: [string, string],
            modelType: string
        ) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Initial Images") return;

                const [pk, progress] = train(
                    current.data.context,
                    current.data.primaryDataset,
                    trainTemplatePK,
                    trainParameters,
                    current.data.domain
                );

                return createNewLoopState("Creating Train Job")(
                    {
                        context: current.data.context,
                        participantNumber: current.data.participantNumber,
                        primaryDataset: current.data.primaryDataset,
                        jobPK: pk,
                        progress: progress,
                        domain: current.data.domain,
                        framework: framework,
                        modelType: modelType,
                        trainTemplatePK: trainTemplatePK,
                        trainParameters: trainParameters,
                        evalTemplatePK: evalTemplatePK,
                        evalParameters: evalParameters,
                        iteration: -1
                    }
                )
            };
        },
        error(reason: any) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Initial Images") return;

                if (reason instanceof Response)
                    return formatResponseError(reason).then((formatted) => {
                        return createErrorState(
                            current.data.context,
                            formatted,
                            current.data.participantNumber
                        )
                    })

                return createErrorState(
                    current.data.context,
                    reason,
                    current.data.participantNumber
                );
            }
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Initial Images") return;

                return createNewLoopState("Selecting Primary Dataset")(
                    {
                        context: current.data.context,
                        participantNumber: current.data.participantNumber,
                        from: current.data.primaryDataset.project
                    }
                )
            };
        }
    },
    "Selecting Prelabel Images": {
        prelabel(
            prelabelTemplatePK: number,
            prelabelParameters: { [parameter_name: string]: ParameterValue }
        ) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Prelabel Images") return;

                const {
                    modelOutputPK,
                    framework,
                    trainTemplatePK,
                    trainParameters,
                    evalTemplatePK,
                    evalParameters,
                    ...otherCurrent
                } = current.data

                if (modelOutputPK === undefined) {
                    console.log("Can't prelabel because modelOutputPK is undefined");
                    return;
                }
                if (framework === undefined) {
                    console.log("Can't prelabel because framework is undefined");
                    return;
                }
                if (trainTemplatePK === undefined) {
                    console.log("Can't prelabel because trainTemplatePK is undefined");
                    return;
                }
                if (trainParameters === undefined) {
                    console.log("Can't prelabel because trainParameters is undefined");
                    return;
                }
                if (evalTemplatePK === undefined) {
                    console.log("Can't prelabel because evalTemplatePK is undefined");
                    return;
                }
                if (evalParameters === undefined) {
                    console.log("Can't prelabel because evalParameters is undefined");
                    return;
                }

                const [pk, progress] = evaluate(
                    current.data.context,
                    prelabelTemplatePK,
                    current.data.targetDataset,
                    modelOutputPK,
                    prelabelParameters,
                    current.data.domain,
                    framework
                );

                return createNewLoopState("Creating Prelabel Job")(
                    {
                        ...otherCurrent,
                        modelOutputPK,
                        additionDataset: current.data.targetDataset,
                        jobPK: pk,
                        progress,
                        framework,
                        trainTemplatePK,
                        trainParameters,
                        evalTemplatePK,
                        evalParameters,
                        iteration: -1
                    }
                )
            };
        },
        label() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Prelabel Images") return;

                return createNewLoopState("User Fixing Categories")(
                    {
                        ...current.data,
                        additionDataset: current.data.targetDataset,
                        iteration: -1,
                        timingInfo: {}
                    }
                )
            }
        },
        error(reason: any) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Prelabel Images") return;

                return createErrorState(
                    current.data.context,
                    reason,
                    current.data.participantNumber
                );
            }
        }
    },
    "Creating Train Job": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Creating Train Job">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            // Make sure the job starts properly before doing anything else
            const jobPK = await handleErrorResponse(current.data.jobPK)
            if (jobPK === HANDLED_ERROR_RESPONSE) return;

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) {
                        silentlyCancelJob(current.data.context, jobPK);
                        return;
                    }

                    return createNewLoopState("Training")(
                        {
                            ...current.data,
                            jobPK: jobPK
                        }
                    )
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Training": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Training">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            // Wait for the training to complete successfully
            try {
                await completionPromise(current.data.progress);
            } catch (e) {
                if (e === CANCELLED) return;
                return tryTransitionToErrorState(current, changeState, e);
            }

            if (await hasStateChanged(current, changeState)) return;

            // Get the model created by the training job
            const modelOutputPK = await handleErrorResponse(
                getModelOutputPK(
                    current.data.context,
                    current.data.jobPK,
                    current.data.domain,
                    current.data.framework
                )
            );

            if (modelOutputPK === HANDLED_ERROR_RESPONSE) return;

            if (await hasStateChanged(current, changeState)) return;

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    const nextIteration = current.data.iteration + 1

                    if (nextIteration <= EXPERIMENT_MAX_ITERATION) {

                        return createNewLoopState("Creating Addition Dataset")(
                            {
                                ...current.data,
                                additionDataset: copyDataset(
                                    current.data.context,
                                    current.data.primaryDataset,
                                    true,
                                    current.data.domain
                                ),
                                iteration: current.data.iteration + 1,
                                modelOutputPK,
                                evaluationDataset: current.data.primaryDataset // Isn't used, so doesn't matter what it is
                            }
                        )
                    } else {
                        return createNewLoopState("Finished")(
                            {
                                ...current.data,
                                modelOutputPK
                            }
                        )
                    }
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Creating Evaluate Job": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Creating Evaluate Job">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            // Make sure the job starts properly before doing anything else
            const jobPK = await handleErrorResponse(current.data.jobPK)
            if (jobPK === HANDLED_ERROR_RESPONSE) return;

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    return createNewLoopState("Evaluating")(
                        {
                            ...current.data,
                            jobPK: jobPK
                        }
                    )
                }
            );
        }
    },
    "Evaluating": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Evaluating">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            // Wait for the training to complete successfully
            try {
                await completionPromise(current.data.progress);
            } catch (e) {
                if (e === CANCELLED) return;
                return tryTransitionToErrorState(current, changeState, e);
            }

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    return createNewLoopState("Creating Addition Dataset")(
                        {
                            ...current.data,
                            additionDataset: copyDataset(
                                current.data.context,
                                current.data.primaryDataset,
                                true,
                                current.data.domain
                            ),
                            iteration: current.data.iteration + 1
                        }
                    )
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Checking": {
        finishChecking(next: "Finished" | "Prelabel") {
            return (current: LoopStateAndData) => {
                if (current.state !== "Checking") return;

                switch (next) {
                    case "Finished":
                        return createNewLoopState("Finished")(
                            {
                                context: current.data.context,
                                participantNumber: current.data.participantNumber,
                                modelOutputPK: current.data.modelOutputPK
                            }
                        )
                    case "Prelabel":
                        return createNewLoopState("Creating Addition Dataset")(
                            {
                                ...current.data,
                                additionDataset: copyDataset(
                                    current.data.context,
                                    current.data.primaryDataset,
                                    true,
                                    current.data.domain
                                ),
                                iteration: current.data.iteration + 1
                            }
                        )
                }
            };
        },
        error(reason: any) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Checking") return;

                return createErrorState(
                    current.data.context,
                    reason,
                    current.data.participantNumber
                );
            }
        },
        reevaluate() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Checking") return;

                // Create the evaluation job
                const [jobPK, progress] = evaluate(
                    current.data.context,
                    current.data.evalTemplatePK,
                    current.data.evaluationDataset,
                    current.data.modelOutputPK,
                    current.data.evalParameters,
                    current.data.domain,
                    current.data.framework
                );

                return createNewLoopState("Creating Evaluate Job")(
                    {
                        ...current.data,
                        jobPK,
                        progress
                    }
                )
            };
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Checking") return;

                return createNewLoopState("Selecting Initial Images")(
                    {
                        ...current.data,
                        targetDataset: current.data.primaryDataset
                    }
                )
            };
        }
    },
    "Creating Addition Dataset": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Creating Addition Dataset">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            const targetDataset = await handleErrorResponse(current.data.additionDataset);

            if (targetDataset === HANDLED_ERROR_RESPONSE) return;

            // Automatically add images to dataset
            await addIterationFilesToDataset(
                current.data.context,
                targetDataset.asNumber,
                current.data.iteration
            )

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    if (getPrelabelMode(current.data.iteration, current.data.participantNumber % 6) === "None") {
                        return createNewLoopState("User Fixing Categories")(
                            {
                                ...current.data,
                                additionDataset: targetDataset,
                                timingInfo: {}
                            }
                        )
                    } else {
                        const date = new Date()
                        const [jobPK, progress] = evaluate(
                            current.data.context,
                            current.data.evalTemplatePK,
                            targetDataset,
                            current.data.modelOutputPK,
                            {
                                ...current.data.evalParameters,
                                frontend_metadata: {
                                    type: "JSON",
                                    value: {
                                        loop_state: "Creating Addition Dataset",
                                        time: date.toString(),
                                        timeMS: date.getTime(),
                                        iteration: current.data.iteration,
                                        participantNumber: current.data.participantNumber,
                                        prelabelMode: getPrelabelMode(current.data.iteration, current.data.participantNumber % 6),
                                        user: current.data.context.username,
                                        host: current.data.context.host,
                                        teamPK: targetDataset.team.asNumber,
                                        projectPK: targetDataset.project.asNumber,
                                        datasetPK: targetDataset.asNumber,
                                    }
                                }
                            },
                            current.data.domain,
                            current.data.framework
                        );

                        return createNewLoopState("Creating Prelabel Job")(
                            {
                                ...newCurrent.data,
                                additionDataset: targetDataset,
                                jobPK,
                                progress
                            }
                        )
                    }
                }
            );
        }
    },
    "Creating Prelabel Job": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Creating Prelabel Job">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            // Make sure the job starts properly before doing anything else
            const jobPK = await handleErrorResponse(current.data.jobPK)
            if (jobPK === HANDLED_ERROR_RESPONSE) return;

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    return createNewLoopState("Prelabel")(
                        {
                            ...current.data,
                            jobPK
                        }
                    );
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Prelabel": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Prelabel">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            // Wait for the evaluation to complete successfully
            try {
                await completionPromise(current.data.progress);
            } catch (e) {
                if (e === CANCELLED) return;
                return tryTransitionToErrorState(current, changeState, e);
            }

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    return createNewLoopState("User Fixing Categories")(
                        {
                            ...current.data,
                            timingInfo: {}
                        }
                    );
                }
            );
        },
        cancel: cancelJobTransition
    },
    "User Fixing Categories": {
        addLabelChangedEvent(
            filename: string,
            oldLabel: OptionalAnnotations<string> | undefined,
            newLabel: OptionalAnnotations<string>
        ) {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createNewLoopState("User Fixing Categories")(
                    {
                        ...current.data,
                        timingInfo: {
                            ...current.data.timingInfo,
                            [(new Date()).getTime()]: {
                                filename,
                                oldLabel: oldLabel === NO_ANNOTATION ? null : oldLabel,
                                newLabel: newLabel === NO_ANNOTATION ? null : newLabel
                            }
                        }

                    }
                )
            };
        },
        finishedFixing() {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createNewLoopState("Merging Additional Images")(
                    {
                        ...current.data,
                        mergeJobPK: correctIterationLabels(
                            current.data.context,
                            current.data.additionDataset.asNumber,
                            current.data.iteration
                        ).then(
                            () =>
                                merge(
                                current.data.context,
                                current.data.primaryDataset,
                                current.data.additionDataset,
                                current.data.domain
                            )
                        )
                    }
                )
            };
        },
        error(reason: any) {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createErrorState(
                    current.data.context,
                    reason,
                    current.data.participantNumber
                );
            }
        },
    },
    "Merging Additional Images": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Merging Additional Images">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            if (await handleErrorResponse(current.data.mergeJobPK) === HANDLED_ERROR_RESPONSE) return;

            if (await hasStateChanged(current, changeState)) return;

            const date = new Date()

            // If we've reached the end of an interface, reset the primary dataset
            let nextPrimaryDataset: DatasetPK;
            if (current.data.iteration % 3 === 0) {
                const datasetPK = (
                    await ICDataset.create(
                        current.data.context,
                        `${EXPERIMENT_DATASET_NAME}-${current.data.iteration}`,
                        current.data.primaryDataset.project.asNumber,
                        1
                    )
                ).pk

                await addIterationFilesToDataset(
                    current.data.context,
                    datasetPK,
                    0,
                    false
                )

                nextPrimaryDataset = current.data.primaryDataset.project.dataset(datasetPK)
            } else {
                nextPrimaryDataset = current.data.primaryDataset;
            }

            const [pk, progress] = train(
                current.data.context,
                nextPrimaryDataset,
                current.data.trainTemplatePK,
                {
                    ...current.data.trainParameters,
                    frontend_metadata: {
                        type: "JSON",
                        value: {
                            loop_state: "Merging Additional Images",
                            time: date.toString(),
                            timeMS: date.getTime(),
                            iteration: current.data.iteration,
                            participantNumber: current.data.participantNumber,
                            prelabelMode: getPrelabelMode(current.data.iteration, current.data.participantNumber % 6),
                            user: current.data.context.username,
                            host: current.data.context.host,
                            teamPK: nextPrimaryDataset.team.asNumber,
                            projectPK: nextPrimaryDataset.project.asNumber,
                            datasetPK: nextPrimaryDataset.asNumber,
                            timingInfo: current.data.timingInfo
                        }
                    }
                },
                current.data.domain
            );

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) {
                        silentlyCancelJob(current.data.context, pk);
                        return;
                    }

                    return createNewLoopState("Creating Train Job")(
                        {
                            ...current.data,
                            primaryDataset: nextPrimaryDataset,
                            jobPK: pk,
                            progress: progress
                        }
                    );
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Finished": {
        download() {
            return (current: LoopStateAndData) => {
                if (current.state === "Finished") {
                    downloadModel(
                        current.data.context,
                        current.data.modelOutputPK
                    );
                }
            };
        },
        reset() {
            return (current: LoopStateAndData) => {
                return createNewLoopState("Initial")(
                    {
                        context: current.data.context
                    }
                );
            };
        }
    },
    "Error": {
        reset() {
            return (current: LoopStateAndData) => {
                return createNewLoopState("Initial")(
                    {
                        context: current.data.context
                    }
                );
            };
        }
    }
} as const;

export type LoopTransitions = typeof LOOP_TRANSITIONS;
