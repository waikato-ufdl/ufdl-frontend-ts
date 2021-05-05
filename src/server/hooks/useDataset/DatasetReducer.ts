import {Dataset} from "../../types/Dataset";
import AddItem from "./actions/AddItem";
import Clear from "./actions/Clear";
import DeleteItem from "./actions/DeleteItem";
import Select from "./actions/Select";
import UpdateItem from "./actions/UpdateItem";
import {Reducer} from "react";


export type DefaultActions<D, A> =
    | AddItem<D, A>
    | Clear
    | DeleteItem
    | Select<D, A>
    | UpdateItem<D, A>

export abstract class DatasetReducerAction<T, D, A> {
    constructor(protected readonly action: T) {}
    public abstract call(currentState: Dataset<D, A>): Dataset<D, A>;
}

export type DatasetReducer<
    D,
    A,
    DRA extends DatasetReducerAction<unknown, D, A>
> = Reducer<Dataset<D, A>, DRA | DefaultActions<D, A>>

export const DATASET_REDUCER: DatasetReducer<any, any, any> = (currentState, action) => action.call(currentState)
