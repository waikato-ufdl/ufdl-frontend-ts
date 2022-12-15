import {LoopStates} from "../../LoopStates";

export const GOOD_STATES = [
    "Selecting Primary Dataset",
    "Selecting Initial Images",
    "Selecting Prelabel Images",
    "Checking",
    "User Fixing Categories"
] as const satisfies readonly (keyof LoopStates)[]