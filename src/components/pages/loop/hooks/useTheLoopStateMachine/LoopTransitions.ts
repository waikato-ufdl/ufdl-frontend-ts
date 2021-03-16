import {DatasetPK} from "../../../../../server/pk";
import {LoopStates} from "./LoopStates";
import {createNewLoopState} from "./createNewLoopState";
import {errorResponseTransition} from "./errorTransition";
import evaluate from "../../jobs/evaluate";
import {AUTOMATIC} from "../../../../../util/react/hooks/useStateMachine/AUTOMATIC";
import train from "../../jobs/train";
import copyDataset from "../../jobs/copyDataset";
import merge from "../../jobs/merge";
import {handleErrorResponse} from "../../../../../server/util/responseError";
import completionPromise from "../../../../../util/rx/completionPromise";

export const LOOP_TRANSITIONS = {
    "Selecting Primary Dataset": {
        primaryDatasetSelected(dataset: DatasetPK) {
            return (_state: "Selecting Primary Dataset", data: LoopStates["Selecting Primary Dataset"]) => {
                return createNewLoopState(
                    "Selecting Images",
                    {
                        context: data.context,
                        primaryDataset: dataset,
                        targetDataset: dataset,
                        modelOutputPK: undefined
                    }
                );
            }
        }
    },
    "Selecting Images": {
        finishedSelectingImages() {
            return (_state: "Selecting Images", data: LoopStates["Selecting Images"]) => {
                if (data.modelOutputPK === undefined) {
                    return createNewLoopState(
                        "Create Train Job",
                        {
                            context: data.context,
                            primaryDataset: data.primaryDataset
                        }
                    );
                } else {
                    return createNewLoopState(
                        "Pre-labelling Images",
                        {
                            context: data.context,
                            primaryDataset: data.primaryDataset,
                            modelOutputPK: data.modelOutputPK,
                            additionDataset: data.targetDataset,
                            progress: evaluate(data.context, data.primaryDataset, data.modelOutputPK)
                        }
                    );
                }
            }
        }
    },
    "Create Train Job": {
        async [AUTOMATIC](_state: "Create Train Job", data: LoopStates["Create Train Job"]) {
            const [pk, progress] = train(data.context, data.primaryDataset);
            const evaluationDataset = copyDataset(data.context, data.primaryDataset, false);
            return createNewLoopState(
                "Training",
                {
                    context: data.context,
                    primaryDataset: data.primaryDataset,
                    modelOutputPK: pk,
                    progress: progress,
                    evaluationDatasetPK: evaluationDataset
                }
            );
        }
    },
    "Training": {
        async [AUTOMATIC](_state: "Training", data: LoopStates["Training"]) {
            return handleErrorResponse(
                data.modelOutputPK.then(
                    async (pk) => {
                        const evaluationDatasetPK = await data.evaluationDatasetPK;

                        return createNewLoopState(
                            "Evaluating",
                            {
                                context: data.context,
                                primaryDataset: data.primaryDataset,
                                evaluationDataset: evaluationDatasetPK,
                                modelOutputPK: pk,
                                progress: evaluate(data.context, evaluationDatasetPK, pk)
                            }
                        )
                    }
                ),
                errorResponseTransition(data.context)
            );
        }
    },
    "Evaluating": {
        async [AUTOMATIC](_state: "Evaluating", data: LoopStates["Evaluating"]) {
            return handleErrorResponse(
                completionPromise(data.progress).then(
                    () => {
                        return createNewLoopState(
                            "Checking",
                            {
                                context: data.context,
                                primaryDataset: data.primaryDataset,
                                evaluationDataset: data.evaluationDataset,
                                modelOutputPK: data.modelOutputPK
                            }
                        );
                    }
                ),
                errorResponseTransition(data.context)
            );
        }
    },
    "Checking": {
        goodEnough(isGoodEnough: boolean) {
            return (_state: "Checking", data: LoopStates["Checking"]) => {
                if (isGoodEnough) {
                    return createNewLoopState(
                        "Finished",
                        undefined
                    )
                } else {
                    return createNewLoopState(
                        "Creating Addition Dataset",
                        {
                            context: data.context,
                            primaryDataset: data.primaryDataset,
                            additionDataset: copyDataset(
                                data.context,
                                data.primaryDataset,
                                true
                            ),
                            modelOutputPK: data.modelOutputPK
                        }
                    )
                }
            }
        }
    },
    "Creating Addition Dataset": {
        async [AUTOMATIC](_state: "Creating Addition Dataset", data: LoopStates["Creating Addition Dataset"]) {
            return handleErrorResponse(
                data.additionDataset.then(
                    (pk) => {
                        return createNewLoopState(
                            "Selecting Images",
                            {
                                context: data.context,
                                primaryDataset: data.primaryDataset,
                                modelOutputPK: data.modelOutputPK,
                                targetDataset: pk
                            }
                        )
                    }
                ),
                errorResponseTransition(data.context)
            );
        }
    },
    "Pre-labelling Images": {
        async [AUTOMATIC](_state: "Pre-labelling Images", data: LoopStates["Pre-labelling Images"]) {
            return handleErrorResponse(
                completionPromise(data.progress).then(
                    () => {
                        return createNewLoopState(
                            "User Fixing Categories",
                            {
                                context: data.context,
                                primaryDataset: data.primaryDataset,
                                modelOutputPK: data.modelOutputPK,
                                additionDataset: data.additionDataset
                            }
                        )
                    }
                ),
                errorResponseTransition(data.context)
            );
        }
    },
    "User Fixing Categories": {
        finishedFixing() {
            return (_state: "User Fixing Categories", data: LoopStates["User Fixing Categories"]) => {
                return createNewLoopState(
                    "Merging Additional Images",
                    {
                        context: data.context,
                        primaryDataset: data.primaryDataset,
                        modelOutputPK: data.modelOutputPK,
                        mergeJobPK: merge(
                            data.context,
                            data.primaryDataset,
                            data.additionDataset
                        )
                    }
                )
            }
        }
    },
    "Merging Additional Images": {
        async [AUTOMATIC](_state: "Merging Additional Images", data: LoopStates["Merging Additional Images"]) {
            return handleErrorResponse(
                async () => {
                    await data.mergeJobPK;

                    const [pk, progress] = train(data.context, data.primaryDataset);

                    const evaluationDataset = copyDataset(data.context, data.primaryDataset, false);

                    return createNewLoopState(
                        "Training",
                        {
                            context: data.context,
                            primaryDataset: data.primaryDataset,
                            modelOutputPK: pk,
                            progress: progress,
                            evaluationDatasetPK: evaluationDataset
                        }
                    );
                },
            errorResponseTransition(data.context)
            )
        }
    },
    "Finished": {},
    "Error": {
        reset() {
            return (_state: "Error", data: LoopStates["Error"]) => createNewLoopState(
                "Selecting Primary Dataset",
                {
                    context: data.context
                }
            );
        }
    }
} as const;

export type LoopTransitions = typeof LOOP_TRANSITIONS;