import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {mapToArray, spreadJoinMaps} from "../../../../util/map";
import {LabelColour, LabelColours} from "./LabelColours";

const LABEL_COLOUR_STORAGE_KEY = "_LABEL_COLOURS_";

export function loadColoursFromContext(
    context: UFDLServerContext
): LabelColours | undefined {
    const stored = context.get_item(LABEL_COLOUR_STORAGE_KEY, false);

    if (stored === null) return undefined;

    const storedJSON: [string, LabelColour][] = JSON.parse(stored);

    return new Map(storedJSON);
}

export function storeColoursInContext(
    labelColours: LabelColours,
    context: UFDLServerContext
) {
    const current = loadColoursFromContext(context);

    const updated = current === undefined
        ? labelColours
        : spreadJoinMaps(
            current,
            labelColours
        );

    const serialised = mapToArray(
        updated,
        (key, value) => [key, value] as const
    );

    context.store_item(LABEL_COLOUR_STORAGE_KEY, JSON.stringify(serialised), false);
}
