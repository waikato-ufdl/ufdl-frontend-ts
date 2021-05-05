import {filterMap} from "../../../../util/map";
import {DatasetReducerAction} from "../DatasetReducer";
import {Dataset} from "../../../types/Dataset";

export default class DeleteItem extends DatasetReducerAction<string, any, any> {
    call(currentState: Dataset<any, any>): Dataset<any, any> {
        if (!currentState.has(this.action)) return currentState;

        return filterMap(
            currentState,
            (filename) => filename !== this.action
        );
    }
}
