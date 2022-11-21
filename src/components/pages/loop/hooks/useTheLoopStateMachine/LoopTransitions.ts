import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {createNewLoopState} from "./createNewLoopState";
import {
    createErrorResponseTransitionHandler, createErrorState,
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
import {AppSettings} from "../../../../../useAppSettings";

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
                changeState(
                    (newCurrent) => {
                        if (newCurrent !== current) return;

                        const newState = loopStateDataConstructor("Selecting Primary Dataset")(
                            {
                                context: context,
                                from: undefined
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
                        primaryDataset: current.data.primaryDataset,
                        jobPK: pk,
                        progress: progress,
                        domain: current.data.domain,
                        framework: framework,
                        modelType: modelType,
                        trainTemplatePK: trainTemplatePK,
                        trainParameters: trainParameters,
                        evalTemplatePK: evalTemplatePK,
                        evalParameters: evalParameters
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
                            formatted
                        )
                    })

                return createErrorState(
                    current.data.context,
                    reason
                );
            }
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Initial Images") return;

                return createNewLoopState("Selecting Primary Dataset")(
                    {
                        context: current.data.context,
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
                        evalParameters
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
                    }
                )
            }
        },
        error(reason: any) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Prelabel Images") return;

                return createErrorState(
                    current.data.context,
                    reason
                );
            }
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Prelabel Images") return;

                return createNewLoopState("Checking")(
                    current.data
                )
            };
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

            // Start creating the evaluation dataset
            const evaluationDataset = await handleErrorResponse(
                copyDataset(current.data.context, current.data.primaryDataset, false, current.data.domain)
            );

            if (evaluationDataset === HANDLED_ERROR_RESPONSE) {
                silentlyCancelJob(current.data.context, current.data.jobPK);
                return
            }

            if (await hasStateChanged(current, changeState)) return;

            // Create the evaluation job
            const [jobPK, progress] = evaluate(
                current.data.context,
                current.data.evalTemplatePK,
                evaluationDataset,
                modelOutputPK,
                current.data.evalParameters,
                current.data.domain,
                current.data.framework
            );

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) {
                        silentlyCancelJob(current.data.context, jobPK);
                        return;
                    }

                    return createNewLoopState("Creating Evaluate Job")(
                        {
                            ...current.data,
                            evaluationDataset: evaluationDataset,
                            modelOutputPK: modelOutputPK,
                            progress: progress,
                            jobPK: jobPK
                        }
                    )
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

                    return createNewLoopState("Checking")(current.data);
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
                                )
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
                    reason
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

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) return;

                    return createNewLoopState("Selecting Prelabel Images")(
                        {
                            ...current.data,
                            targetDataset: targetDataset
                        }
                    )
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
                        current.data
                    );
                }
            );
        },
        cancel: cancelJobTransition
    },
    "User Fixing Categories": {
        finishedFixing() {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createNewLoopState("Merging Additional Images")(
                    {
                        ...current.data,
                        mergeJobPK: merge(
                            current.data.context,
                            current.data.primaryDataset,
                            current.data.additionDataset,
                            current.data.domain
                        )
                    }
                )
            };
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createNewLoopState("Selecting Prelabel Images")(
                    {
                        ...current.data,
                        targetDataset: current.data.additionDataset
                    }
                )
            };
        },
        error(reason: any) {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createErrorState(
                    current.data.context,
                    reason
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

            const [pk, progress] = train(
                current.data.context,
                current.data.primaryDataset,
                current.data.trainTemplatePK,
                current.data.trainParameters,
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
                return createNewLoopState("Selecting Primary Dataset")(
                    {
                        context: current.data.context,
                        from: undefined
                    }
                );
            };
        }
    },
    "Error": {
        reset() {
            return (current: LoopStateAndData) => {
                return createNewLoopState("Selecting Primary Dataset")(
                    {
                        context: current.data.context,
                        from: undefined
                    }
                );
            };
        }
    }
} as const;

export type LoopTransitions = typeof LOOP_TRANSITIONS;
