import {DatasetReducerAction} from "../DatasetReducer";
import {Dataset} from "../../../types/Dataset";

export default class Clear extends DatasetReducerAction<undefined, any, any> {

    constructor() {
        super(undefined);
    }

    call(): Dataset<any, any> {
        return new Map();
    }
}
