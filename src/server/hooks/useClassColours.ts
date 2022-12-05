import {createMapStateReducer, MapStateDispatch} from "../../util/react/hooks/useMapState";
import {ClassColour, ClassColours, loadColoursFromContext, pickNewRandomColour} from "../util/classification";
import {NO_ANNOTATION} from "../NO_ANNOTATION";
import {Classification} from "../types/annotations/Classification";
import {copyMap} from "../../util/map";
import {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../UFDLServerContextProvider";
import useDerivedReducer from "../../util/react/hooks/useDerivedReducer";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {DatasetDispatch} from "./useDataset/DatasetDispatch";
import {Data} from "../types/data";
import hasData from "../../util/react/query/hasData";
import isDefined from "../../util/typescript/isDefined";
import {constantInitialiser} from "../../util/typescript/initialisers";
import useNonUpdatingState from "../../util/react/hooks/useNonUpdatingState";


const CLASS_COLOURS_REDUCER = createMapStateReducer<string, ClassColour>();

function initialiseClassColours(
    [dataset]: readonly [DatasetDispatch<Data, Classification> | undefined],
    currentState: ClassColours
): ClassColours {
    const classColours: Map<string, ClassColour> = copyMap(currentState);

    let noneSet = true;

    if (dataset !== undefined) {
        dataset.forEach(
            (item) => {
                if (!hasData(item.annotations)) return
                const classification = item.annotations.data;
                if (classification === NO_ANNOTATION) return;
                if (classColours.has(classification)) return;
                classColours.set(classification, pickNewRandomColour(classColours));
                noneSet = false;
            }
        );
    }

    // Return the previous state if it wasn't updated, to avoid unnecessary triggers
    if (noneSet) return currentState;

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
    dataset: DatasetDispatch<Data, Classification> | undefined,
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
        () => isDefined(initialColours) ? initialColours : new Map()
    );

    const [getReducerState, setReducerState] = useNonUpdatingState(constantInitialiser(reducerState));
    setReducerState(reducerState)

    // Wrap the dispatch in an object
    return useDerivedState(
        () => new ClassColoursDispatch(getReducerState, dispatch),
        [getReducerState, dispatch] as const
    );
}
