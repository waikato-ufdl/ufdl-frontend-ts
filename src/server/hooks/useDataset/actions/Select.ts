import {copyMap} from "../../../../util/map";
import {DatasetReducerAction} from "../DatasetReducer";
import {Dataset} from "../../../types/Dataset";
import {SelectFunction} from "../selection/SelectFunction";

export default class Select<D, A> extends DatasetReducerAction<SelectFunction<D, A>, D, A> {
    call(currentState: Dataset<D, A>): Dataset<D, A> {
        let anyChanged: boolean = false;

        const newState = copyMap(
            currentState,
            (filename, item) => {
                const selected = this.action(filename, item);
                if (selected === item.selected) return true;
                anyChanged = true;
                return [filename, {...item, selected: selected}];
            }
        );

        return anyChanged ? newState : currentState;
    }
}
