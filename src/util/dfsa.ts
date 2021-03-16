import {Optional} from "ufdl-js-client/util";

export type StateLabel = string | number | symbol

export type TransitionFunction<
    States extends readonly StateLabel[],
    Input
> = (value: Input) => States[number] | null

export type TransitionTable<
    States extends readonly StateLabel[],
    Input
> = {[key in States[number]]?: TransitionFunction<States, Input>}

export class DFSADefinition<
    States extends readonly StateLabel[],
    Input
> {
    readonly startState: States[number];
    private transitions: TransitionTable<States, Input>;

    constructor(
        startState: States[number],
        transitions: TransitionTable<States, Input>
    ) {
        this.startState = startState;
        this.transitions = {...transitions};
    }

    transitionFunction(state: States[number]): Optional<TransitionFunction<States, Input>> {
        return this.transitions[state];
    }

    initialise(): DFSA<States, Input> {
        return new DFSA(this);
    }
}

export class DFSA<
    States extends readonly StateLabel[],
    Input
> {

    constructor(
        readonly definition: DFSADefinition<States, Input>,
        readonly currentState: States[number] = definition.startState
    ) {}

    get transitionFunctionForCurrentState(): Optional<TransitionFunction<States, Input>> {
        return this.definition.transitionFunction(this.currentState);
    }

    get copy(): DFSA<States, Input> {
        return new DFSA(this.definition, this.currentState);
    }

    transition(
        input: Input
    ): DFSA<States, Input> {
        const transitionFunctionForCurrentState = this.transitionFunctionForCurrentState;

        if (transitionFunctionForCurrentState === undefined) return this.copy;

        const newState: States[number] | null = transitionFunctionForCurrentState(input);

        if (newState === null) return this.copy;

        return new DFSA(this.definition, newState);
    }
}
