import {DatasetPK, ProjectPK, TeamPK} from "../../../../../server/pk";
import {createNewLoopState} from "./createNewLoopState";
import evaluate from "../../jobs/evaluate";
import {AUTOMATIC} from "../../../../../util/react/hooks/useStateMachine/AUTOMATIC";
import train from "../../jobs/train";
import copyDataset from "../../jobs/copyDataset";
import merge from "../../jobs/merge";
import getModelOutputPK from "../../jobs/getModelOutputPK";
import downloadModel from "../../jobs/downloadModel";
import {LoopStateAndData} from "./types";
import {silentlyCancelJobOnTransitionFailure} from "./silentlyCancelJob";
import {CANCEL_JOB_TRANSITION} from "./CANCEL_JOB_TRANSITION";
import behaviourSubjectCompletionPromise from "../../../../../util/rx/behaviourSubjectCompletionPromise";
import {DomainName} from "../../../../../server/domains";
import {ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {restoreLoopState} from "./save";
import {AppSettings} from "../../../../../useAppSettings";
import {StateMachineTransitions} from "../../../../../util/react/hooks/useStateMachine/types/StateMachineTransitions";
import {LoopStates} from "./LoopStates";
import {
    CheckForStateChangeFunction
} from "../../../../../util/react/hooks/useStateMachine/types/CheckForStateChangeFunction";
import {ERROR_TRANSITION} from "./error/ERROR_TRANSITION";

export const LOOP_TRANSITIONS = {
    "Initial": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Initial">
        ) {
            const context = this.data.context

            const previousLoopState = restoreLoopState(context)

            if (previousLoopState !== undefined) {
                return previousLoopState
            } else {
                return createNewLoopState("Selecting Primary Dataset")(
                    {
                        context: context,
                        from: undefined
                    }
                )
            }
        }
    },
    "Selecting Primary Dataset": {
        setSelected(
            this: LoopStateAndData<"Selecting Primary Dataset">,
            selection?: DatasetPK | ProjectPK | TeamPK,
            domain?: DomainName,
            settings?: AppSettings
        ) {
            if (selection instanceof DatasetPK) {
                if (domain === undefined) return;
                return createNewLoopState("Selecting Initial Images")(
                    {
                        ...this.data,
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
                        ...this.data,
                        from: selection
                    }
                )
            }
        },
        back(this: LoopStateAndData<"Selecting Primary Dataset">) {
            return createNewLoopState("Selecting Primary Dataset")(
                {
                    ...this.data,
                    from: this.data.from instanceof ProjectPK ? this.data.from.team : undefined
                }
            )
        }
    },
    "Selecting Initial Images": {
        trainInitialModel(
            this: LoopStateAndData<"Selecting Initial Images">,
            trainTemplatePK: number,
            trainParameters: { [parameter_name: string]: ParameterValue},
            evalTemplatePK: number,
            evalParameters: { [parameter_name: string]: ParameterValue},
            framework: [string, string],
            modelType: string
        ) {
            const [pk, progress] = train(
                this.data.context,
                this.data.primaryDataset,
                trainTemplatePK,
                trainParameters,
                this.data.domain
            );

            return createNewLoopState("Creating Train Job")(
                {
                    context: this.data.context,
                    primaryDataset: this.data.primaryDataset,
                    jobPK: pk,
                    progress: progress,
                    domain: this.data.domain,
                    framework: framework,
                    modelType: modelType,
                    trainTemplatePK: trainTemplatePK,
                    trainParameters: trainParameters,
                    evalTemplatePK: evalTemplatePK,
                    evalParameters: evalParameters
                }
            )
        },
        error: ERROR_TRANSITION,
        back(
            this: LoopStateAndData<"Selecting Initial Images">
        ) {
            return createNewLoopState("Selecting Primary Dataset")(
                {
                    context: this.data.context,
                    from: this.data.primaryDataset.project
                }
            )
        }
    },
    "Selecting Prelabel Images": {
        prelabel(
            this: LoopStateAndData<"Selecting Prelabel Images">,
            prelabelTemplatePK: number,
            prelabelParameters: { [parameter_name: string]: ParameterValue }
        ) {
            const {
                modelOutputPK,
                framework,
                trainTemplatePK,
                trainParameters,
                evalTemplatePK,
                evalParameters,
                ...otherCurrent
            } = this.data

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
                this.data.context,
                prelabelTemplatePK,
                this.data.targetDataset,
                modelOutputPK,
                prelabelParameters,
                this.data.domain,
                framework
            );

            return createNewLoopState("Creating Prelabel Job")(
                {
                    ...otherCurrent,
                    modelOutputPK,
                    additionDataset: this.data.targetDataset,
                    jobPK: pk,
                    progress,
                    framework,
                    trainTemplatePK,
                    trainParameters,
                    evalTemplatePK,
                    evalParameters
                }
            )
        },
        label(
            this: LoopStateAndData<"Selecting Prelabel Images">
        ) {
            return createNewLoopState("User Fixing Categories")(
                {
                    ...this.data,
                    additionDataset: this.data.targetDataset,
                }
            )
        },
        error: ERROR_TRANSITION,
        back(
            this: LoopStateAndData<"Selecting Prelabel Images">
        ) {
            return createNewLoopState("Checking")(
                this.data
            )
        }
    },
    "Creating Train Job": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Creating Train Job">
        ) {
            // Make sure the job starts properly before doing anything else
            const jobPK = await this.data.jobPK

            return [
                createNewLoopState("Training")(
                    {
                        ...this.data,
                        jobPK
                    }
                ),
                silentlyCancelJobOnTransitionFailure(this.data.context, jobPK)
            ]
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "Training": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Training">,
            checkForStateChange: CheckForStateChangeFunction
        ) {
            // Wait for the training to complete successfully
            await behaviourSubjectCompletionPromise(this.data.progress);

            await checkForStateChange()

            // Get the model created by the training job
            const modelOutputPK: number = await getModelOutputPK(
                this.data.context,
                this.data.jobPK,
                this.data.domain,
                this.data.framework
            )

            await checkForStateChange()

            // Start creating the evaluation dataset
            const evaluationDataset = await copyDataset(
                this.data.context,
                this.data.primaryDataset,
                false,
                this.data.domain
            )

            await checkForStateChange()

            // Create the evaluation job
            const [jobPK, progress] = evaluate(
                this.data.context,
                this.data.evalTemplatePK,
                evaluationDataset,
                modelOutputPK,
                this.data.evalParameters,
                this.data.domain,
                this.data.framework
            );

            return [
                createNewLoopState("Creating Evaluate Job")(
                    {
                        ...this.data,
                        evaluationDataset: evaluationDataset,
                        modelOutputPK: modelOutputPK,
                        progress: progress,
                        jobPK: jobPK
                    }
                ),
                silentlyCancelJobOnTransitionFailure(this.data.context, jobPK)
            ]
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "Creating Evaluate Job": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Creating Evaluate Job">
        ) {
            // Make sure the job starts properly before doing anything else
            const jobPK = await this.data.jobPK

            return [
                createNewLoopState("Evaluating")(
                    {
                        ...this.data,
                        jobPK
                    }
                ),
                silentlyCancelJobOnTransitionFailure(this.data.context, jobPK)
            ]
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "Evaluating": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Evaluating">
        ) {
            // Wait for the training to complete successfully
            await behaviourSubjectCompletionPromise(this.data.progress);

            return createNewLoopState("Checking")(this.data);
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "Checking": {
        finishChecking(
            this: LoopStateAndData<"Checking">,
            next: "Finished" | "Prelabel"
        ) {
            switch (next) {
                case "Finished":
                    return createNewLoopState("Finished")(
                        {
                            context: this.data.context,
                            modelOutputPK: this.data.modelOutputPK
                        }
                    )
                case "Prelabel":
                    return createNewLoopState("Creating Addition Dataset")(
                        {
                            ...this.data,
                            additionDataset: copyDataset(
                                this.data.context,
                                this.data.primaryDataset,
                                true,
                                this.data.domain
                            )
                        }
                    )
            }
        },
        error: ERROR_TRANSITION,
        reevaluate(
            this: LoopStateAndData<"Checking">
        ) {
            // Create the evaluation job
            const [jobPK, progress] = evaluate(
                this.data.context,
                this.data.evalTemplatePK,
                this.data.evaluationDataset,
                this.data.modelOutputPK,
                this.data.evalParameters,
                this.data.domain,
                this.data.framework
            );

            return createNewLoopState("Creating Evaluate Job")(
                {
                    ...this.data,
                    jobPK,
                    progress
                }
            )
        },
        back(
            this: LoopStateAndData<"Checking">
        ) {
            return createNewLoopState("Selecting Initial Images")(
                {
                    ...this.data,
                    targetDataset: this.data.primaryDataset
                }
            )
        }
    },
    "Creating Addition Dataset": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Creating Addition Dataset">
        ) {
            const targetDataset = await this.data.additionDataset

            return createNewLoopState("Selecting Prelabel Images")(
                {
                    ...this.data,
                    targetDataset: targetDataset
                }
            )
        }
    },
    "Creating Prelabel Job": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Creating Prelabel Job">
        ) {
            // Make sure the job starts properly before doing anything else
            const jobPK = await this.data.jobPK


            return createNewLoopState("Prelabel")(
                {
                    ...this.data,
                    jobPK
                }
            )
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "Prelabel": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Prelabel">
        ) {
            // Wait for the evaluation to complete successfully
            await behaviourSubjectCompletionPromise(this.data.progress)

            return createNewLoopState("User Fixing Categories")(
                this.data
            )
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "User Fixing Categories": {
        finishedFixing(
            this: LoopStateAndData<"User Fixing Categories">
        ) {
            return createNewLoopState("Merging Additional Images")(
                {
                    ...this.data,
                    mergeJobPK: merge(
                        this.data.context,
                        this.data.primaryDataset,
                        this.data.additionDataset,
                        this.data.domain
                    )
                }
            )
        },
        back(
            this: LoopStateAndData<"User Fixing Categories">
        ) {
            return createNewLoopState("Selecting Prelabel Images")(
                {
                    ...this.data,
                    targetDataset: this.data.additionDataset
                }
            )
        },
        error: ERROR_TRANSITION,
    },
    "Merging Additional Images": {
        async [AUTOMATIC](
            this: LoopStateAndData<"Merging Additional Images">,
            checkForStateChange: CheckForStateChangeFunction
        ) {
            await this.data.mergeJobPK

            await checkForStateChange()

            const [pk, progress] = train(
                this.data.context,
                this.data.primaryDataset,
                this.data.trainTemplatePK,
                this.data.trainParameters,
                this.data.domain
            );

            return [
                createNewLoopState("Creating Train Job")(
                    {
                        ...this.data,
                        jobPK: pk,
                        progress: progress
                    }
                ),
                silentlyCancelJobOnTransitionFailure(this.data.context, pk)
            ]
        },
        cancel: CANCEL_JOB_TRANSITION
    },
    "Finished": {
        download(
            this: LoopStateAndData<"Finished">
        ) {
            downloadModel(
                this.data.context,
                this.data.modelOutputPK
            );
        },
        reset(
            this: LoopStateAndData<"Finished">
        ) {
            return createNewLoopState("Selecting Primary Dataset")(
                {
                    context: this.data.context,
                    from: undefined
                }
            );
        }
    },
    "Error": {
        reset(
            this: LoopStateAndData<"Error">
        ) {
            return createNewLoopState("Selecting Primary Dataset")(
                {
                    context: this.data.context,
                    from: undefined
                }
            );
        }
    }
} as const satisfies StateMachineTransitions<LoopStates>;

export type LoopTransitions = typeof LOOP_TRANSITIONS;
