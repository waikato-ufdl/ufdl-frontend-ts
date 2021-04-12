import {ImageClassificationDataset} from "../../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";
import {LabelColour, LabelColours, loadColoursFromContext, pickNewRandomColour} from "./LabelColours";
import {createMapStateReducer, MapStateDispatch} from "../../../../util/react/hooks/useMapState";
import useDerivedReducer from "../../../../util/react/hooks/useDerivedReducer";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {copyMap} from "../../../../util/map";
import {useContext, useEffect} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";

function initialiseLabelColours(
    dataset: readonly [ImageClassificationDataset | undefined],
    currentState?: LabelColours
): LabelColours {
    const labelColours: Map<string, LabelColour>
        = currentState === undefined ? new Map() : copyMap(currentState);

    if (dataset[0] !== undefined) {
        dataset[0].forEach(
            (item) => {
                const label = item.annotations;
                if (label === undefined) return;
                if (labelColours.has(label)) return;
                labelColours.set(label, pickNewRandomColour(labelColours));
            }
        );
    }

    return labelColours;
}

const labelColoursReducer = createMapStateReducer<string, LabelColour>();

export class LabelColoursDispatch extends MapStateDispatch<string, LabelColour> {
    add(label: string): void {
        if (label !== "" && !this.state.has(label))
            this.set(label, pickNewRandomColour(this.state))
    }
}

export default function useLabelColours(
    dataset: ImageClassificationDataset | undefined,
    initialLabelColours?: LabelColours
): LabelColoursDispatch {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    // Create a reducer which acts as a map of label-colours, but re-initialises
    // when the dataset's pk changes
    const [reducerState, dispatch] = useDerivedReducer(
        labelColoursReducer,
        initialiseLabelColours,
        [dataset] as const,
        initialLabelColours
    );

    // Wrap the dispatch in an object
    const mapDispatch =  useDerivedState(
        ([reducerState, dispatch]) => new LabelColoursDispatch(reducerState, dispatch),
        [reducerState, dispatch] as const
    );

    useEffect(
        () => {
            loadColoursFromContext(ufdlServerContext).then(
                (colours) => {
                    if (colours !== undefined) {
                        colours.forEach(
                            (colour, label) => {
                                if (!mapDispatch.state.has(label)) mapDispatch.set(label, colour)
                            }
                        );
                    }
                }
            )

        },
        [ufdlServerContext.host, ufdlServerContext.username, dataset]
    );

    return mapDispatch;
}