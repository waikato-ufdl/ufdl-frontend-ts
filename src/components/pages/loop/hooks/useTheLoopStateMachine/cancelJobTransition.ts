import {LoopStateAndData} from "./types";
import {createNewLoopState} from "./createNewLoopState";
import {silentlyCancelJob} from "./silentlyCancelJob";

export default function cancelJobTransition(
    // No parameters
): (current: LoopStateAndData) => (LoopStateAndData | void) {
    return (current) => {
        switch (current.state) {
            case "Training":
            case "Evaluating":
            case "Prelabel":
                silentlyCancelJob(current.data.context, current.data.jobPK);
        }

        switch (current.state) {
            case "Training":
            case "Evaluating":
            case "Merging Additional Images":
                return createNewLoopState(
                    "Selecting Images",
                    {
                        context: current.data.context,
                        primaryDataset: current.data.primaryDataset,
                        modelOutputPK: undefined,
                        targetDataset: current.data.primaryDataset
                    }
                );
            case "Prelabel":
                return createNewLoopState(
                    "Selecting Images",
                    {
                        context: current.data.context,
                        primaryDataset: current.data.primaryDataset,
                        modelOutputPK: undefined,
                        targetDataset: current.data.additionDataset
                    }
                );
            default:
                return;
        }
    }
}
