import {GoodState} from "./GoodState";
import {isAllowedStateAndData} from "../../../../../../../util/react/hooks/useStateMachine/isAllowedState";
import {GOOD_STATES} from "./GOOD_STATES";
import {LoopStateAndData} from "../../types/LoopStateAndData";

export default function isGoodStateAndData(
    stateAndData: LoopStateAndData
): stateAndData is LoopStateAndData<GoodState> {
    return isAllowedStateAndData(stateAndData, ...GOOD_STATES)
}
