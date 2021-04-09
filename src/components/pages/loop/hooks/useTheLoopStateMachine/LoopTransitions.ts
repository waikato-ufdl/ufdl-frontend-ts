import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {createNewLoopState} from "./createNewLoopState";
import {
    createErrorResponseTransitionHandler,
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
import {CANCELLED} from "../../../../../server/websocket/observableWebSocket";

export const LOOP_TRANSITIONS = {
    "Selecting Primary Dataset": {
        setSelected(selection: DatasetPK | ProjectPK | TeamPK | undefined) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Primary Dataset") return;

                if (selection instanceof DatasetPK) {
                    return createNewLoopState(
                        "Selecting Images",
                        {
                            context: current.data.context,
                            primaryDataset: selection,
                            targetDataset: selection,
                            modelOutputPK: undefined
                        }
                    );
                } else {
                    return createNewLoopState(
                        "Selecting Primary Dataset",
                        {
                            context: current.data.context,
                            from: selection
                        }
                    );
                }
            }
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Primary Dataset") return;

                return createNewLoopState(
                    "Selecting Primary Dataset",
                    {
                        context: current.data.context,
                        from: current.data.from instanceof ProjectPK ? current.data.from.team : undefined
                    }
                );
            }
        }
    },
    "Selecting Images": {
        finishedSelectingImages() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Images") return;

                if (current.data.modelOutputPK === undefined) {
                    const [pk, progress] = train(
                        current.data.context,
                        current.data.primaryDataset
                    );

                    return createNewLoopState(
                        "Training",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            jobPK: pk,
                            progress: progress
                        }
                    );
                } else {
                    const [pk, progress] = evaluate(
                        current.data.context,
                        current.data.targetDataset,
                        current.data.modelOutputPK
                    );

                    return createNewLoopState(
                        "Prelabel",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            modelOutputPK: current.data.modelOutputPK,
                            additionDataset: current.data.targetDataset,
                            jobPK: pk,
                            progress: progress
                        }
                    );
                }
            };
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Selecting Images") return;

                if (current.data.modelOutputPK === undefined) {
                    return createNewLoopState(
                        "Selecting Primary Dataset",
                        {
                            context: current.data.context,
                            from: current.data.primaryDataset.project
                        }
                    );
                } else {
                    return createNewLoopState(
                        "Selecting Images",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            modelOutputPK: undefined,
                            targetDataset: current.data.primaryDataset
                        }
                    );
                }
            };
        }
    },
    "Training": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Training">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            // Make sure the job starts properly before doing anything else
            if (await handleErrorResponse(current.data.jobPK) === HANDLED_ERROR_RESPONSE) return;

            if (await hasStateChanged(current, changeState)) return;

            // Start creating the evaluation dataset
            const evaluationDataset = await handleErrorResponse(
                copyDataset(current.data.context, current.data.primaryDataset, false)
            );

            if (evaluationDataset === HANDLED_ERROR_RESPONSE) {
                silentlyCancelJob(current.data.context, current.data.jobPK);
                return
            }

            if (await hasStateChanged(current, changeState)) return;

            // Wait for the training to complete successfully
            try {
                await completionPromise(current.data.progress);
            } catch (e) {
                if (e === CANCELLED) return;
                return tryTransitionToErrorState(current, changeState, e);
            }

            // Get the model created by the training job
            const modelOutputPK = await handleErrorResponse(
                getModelOutputPK(
                    current.data.context,
                    await current.data.jobPK
                )
            );

            if (modelOutputPK === HANDLED_ERROR_RESPONSE) return;

            if (await hasStateChanged(current, changeState)) return;

            // Create the evaluation job
            const [jobPK, progress] = evaluate(
                current.data.context,
                evaluationDataset,
                modelOutputPK
            );

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) {
                        silentlyCancelJob(current.data.context, jobPK);
                        return;
                    }

                    return createNewLoopState(
                        "Evaluating",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            evaluationDataset: evaluationDataset,
                            modelOutputPK: modelOutputPK,
                            progress: progress,
                            jobPK: jobPK
                        }
                    );
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Evaluating": {
        async [AUTOMATIC](
            current: LoopStateAndData<"Evaluating">,
            changeState: Dispatch<LoopStateTransition>
        ) {
            const handleErrorResponse = createErrorResponseTransitionHandler(current, changeState);

            // Make sure the job starts properly before doing anything else
            if (await handleErrorResponse(current.data.jobPK) === HANDLED_ERROR_RESPONSE) return;

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

                    return createNewLoopState(
                        "Checking",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            evaluationDataset: current.data.evaluationDataset,
                            modelOutputPK: current.data.modelOutputPK
                        }
                    );
                }
            );
        },
        cancel: cancelJobTransition
    },
    "Checking": {
        goodEnough(isGoodEnough: boolean) {
            return (current: LoopStateAndData) => {
                if (current.state !== "Checking") return;
                if (isGoodEnough) {
                    return createNewLoopState(
                        "Finished",
                        {
                            context: current.data.context,
                            modelOutputPK: current.data.modelOutputPK
                        }
                    )
                } else {
                    return createNewLoopState(
                        "Creating Addition Dataset",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            additionDataset: copyDataset(
                                current.data.context,
                                current.data.primaryDataset,
                                true
                            ),
                            modelOutputPK: current.data.modelOutputPK
                        }
                    )
                }
            };
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "Checking") return;
                return createNewLoopState(
                    "Selecting Images",
                    {
                        context: current.data.context,
                        primaryDataset: current.data.primaryDataset,
                        modelOutputPK: undefined,
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

                    return createNewLoopState(
                        "Selecting Images",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            modelOutputPK: current.data.modelOutputPK,
                            targetDataset: targetDataset
                        }
                    )
                }
            );
        }
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

                    return createNewLoopState(
                        "User Fixing Categories",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
                            modelOutputPK: current.data.modelOutputPK,
                            additionDataset: current.data.additionDataset
                        }
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

                return createNewLoopState(
                    "Merging Additional Images",
                    {
                        context: current.data.context,
                        primaryDataset: current.data.primaryDataset,
                        modelOutputPK: current.data.modelOutputPK,
                        mergeJobPK: merge(
                            current.data.context,
                            current.data.primaryDataset,
                            current.data.additionDataset
                        )
                    }
                )
            };
        },
        back() {
            return (current: LoopStateAndData) => {
                if (current.state !== "User Fixing Categories") return;

                return createNewLoopState(
                    "Selecting Images",
                    {
                        context: current.data.context,
                        primaryDataset: current.data.primaryDataset,
                        modelOutputPK: current.data.modelOutputPK,
                        targetDataset: current.data.additionDataset
                    }
                )
            };
        }
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
                current.data.primaryDataset
            );

            changeState(
                (newCurrent) => {
                    if (newCurrent !== current) {
                        silentlyCancelJob(current.data.context, pk);
                        return;
                    }

                    return createNewLoopState(
                        "Training",
                        {
                            context: current.data.context,
                            primaryDataset: current.data.primaryDataset,
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
                return createNewLoopState(
                    "Selecting Primary Dataset",
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
                return createNewLoopState(
                    "Selecting Primary Dataset",
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