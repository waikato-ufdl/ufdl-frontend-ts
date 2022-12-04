import {createNewLoopState} from "./createNewLoopState";
import {silentlyCancelJob} from "./silentlyCancelJob";
import {ManualStateTransition} from "../../../../../util/react/hooks/useStateMachine/types/ManualStateTransition";
import {LoopStates} from "./LoopStates";

export const CANCEL_JOB_TRANSITION: ManualStateTransition<
    LoopStates,
    | "Training"
    | "Evaluating"
    | "Prelabel"
    | "Merging Additional Images"
    | "Creating Train Job"
    | "Creating Evaluate Job"
    | "Creating Prelabel Job"
>
    = function(this) {
        switch (this.state) {
            case "Training":
            case "Evaluating":
            case "Prelabel":
                silentlyCancelJob(this.data.context, this.data.jobPK);
        }

        switch (this.state) {
            case "Training":
            case "Evaluating":
            case "Merging Additional Images":
                return createNewLoopState("Selecting Initial Images")(
                    {
                        ...this.data,
                        targetDataset: this.data.primaryDataset
                    }
                );
            case "Prelabel":
                return createNewLoopState("Selecting Prelabel Images")(
                    {
                        ...this.data,
                        targetDataset: this.data.additionDataset
                    }
                );
            default:
                return;
        }
    }
