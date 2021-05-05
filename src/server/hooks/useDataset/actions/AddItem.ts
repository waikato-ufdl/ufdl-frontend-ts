import {copyMap} from "../../../../util/map";
import {DatasetItem} from "../../../types/DatasetItem";
import {DatasetReducerAction} from "../DatasetReducer";
import {Dataset} from "../../../types/Dataset";


export default class AddItem<D, A> extends DatasetReducerAction<DatasetItem<D, A>, D, A> {
    call(currentState: Dataset<D, A>): Dataset<D, A> {
        const result = copyMap(currentState);
        result.set(this.action.filename, this.action);
        return result;
    }
}
