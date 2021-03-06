import {createMapStateReducer, MapStateDispatch} from "../../util/react/hooks/useMapState";
import {ClassColour, ClassColours, loadColoursFromContext, pickNewRandomColour} from "../util/classification";
import {Dataset} from "../types/Dataset";
import {Classification, NO_CLASSIFICATION} from "../types/annotations";
import {copyMap} from "../../util/map";
import {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../UFDLServerContextProvider";
import useDerivedReducer from "../../util/react/hooks/useDerivedReducer";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import useStaticStateAccessor from "../../util/react/hooks/useStaticStateAccessor";


const CLASS_COLOURS_REDUCER = createMapStateReducer<string, ClassColour>();

function initialiseClassColours(
    dataset: readonly [Dataset<unknown, Classification> | undefined],
    currentState?: ClassColours
): ClassColours {
    const classColours: Map<string, ClassColour> = currentState === undefined
        ? new Map()
        : copyMap(currentState);

    let noneSet = true;

    if (dataset[0] !== undefined) {
        dataset[0].forEach(
            (item) => {
                const classification = item.annotations.success ? item.annotations.value : NO_CLASSIFICATION;
                if (classification === NO_CLASSIFICATION) return;
                if (classColours.has(classification)) return;
                classColours.set(classification, pickNewRandomColour(classColours));
                noneSet = false;
            }
        );
    }

    if (currentState !== undefined && noneSet) return currentState;

    return classColours;
}

export class ClassColoursDispatch extends MapStateDispatch<string, ClassColour> {
    add(label: string): void {
        if (label !== "" && !this.state.has(label))
            this.set(
                label,
                pickNewRandomColour(this.state)
            )
    }
}

export default function useClassColours(
    dataset: Dataset<any, Classification> | undefined,
    initialColours?: ClassColours
): ClassColoursDispatch {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    if (initialColours === undefined) {
        initialColours = loadColoursFromContext(ufdlServerContext);
    }

    // Create a reducer which acts as a map of label-colours, but re-initialises
    // when the dataset's pk changes
    const [reducerState, dispatch] = useDerivedReducer(
        CLASS_COLOURS_REDUCER,
        initialiseClassColours,
        [dataset] as const,
        initialColours
    );

    const reducerStateAccessor = useStaticStateAccessor(reducerState);

    // Wrap the dispatch in an object
    return useDerivedState(
        () => new ClassColoursDispatch(reducerStateAccessor, dispatch),
        [reducerStateAccessor, dispatch] as const
    );
}
