import {DatasetReducerAction} from "../DatasetReducer";
import {Dataset} from "../../../types/Dataset";
import {copyMap} from "../../../../util/map";
import {DatasetItem} from "../../../types/DatasetItem";

export type UpdateItemData<D, A> = {
    filename: string
} & Partial<DatasetItem<D, A>>

export default class UpdateItem<D, A> extends DatasetReducerAction<UpdateItemData<D, A>, D, A> {
    call(currentState: Dataset<D, A>): Dataset<D, A> {
        return copyMap(
            currentState,
            (filename, item) => filename === this.action.filename
                ? [
                    filename,
                    {...item, ...this.action}
                ]
                : true
        );
    }
}
