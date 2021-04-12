import CSS from "csstype";
import {mapReduce, mapToArray, spreadJoinMaps} from "../../../../util/map";
import {toHexString} from "ufdl-ts-client/util";
import {pseudoRandomBytes} from "crypto";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";

export type LabelColour = CSS.Property.BackgroundColor & CSS.Property.BorderColor

export type LabelColours = ReadonlyMap<string, LabelColour>

export function sortedLabelColourArray(labelColours: LabelColours): [string, LabelColour][] {
    let arr: [string, LabelColour][] = mapToArray(labelColours, (key, value) => [key, value]);
    arr.sort((a, b) => {return a[0].localeCompare(b[0])});
    return arr;
}

export function ensureColoursFor(labelColours: LabelColours, ...labels: string[]): LabelColours {
    const newColours = new Map<string, LabelColour>();

    labels.forEach(
        (label) => {
            if (labelColours.has(label)) return;

            const colour = pickNewRandomColour(labelColours);

            newColours.set(label, colour);
        }
    );

    return spreadJoinMaps(
        labelColours,
        newColours
    );
}

export function pickNewRandomColour(labelColours: LabelColours): string {
    let foundUniqueNewColour: boolean = false;
    let newColour: string = "";

    const testColour = (colour: string) => {
        if (colour === newColour) foundUniqueNewColour = false;
    };

    while (!foundUniqueNewColour) {
        newColour = "#" + toHexString(pseudoRandomBytes(3));
        foundUniqueNewColour = true;
        labelColours.forEach(testColour);
    }

    return newColour;
}

const LABEL_COLOUR_STORAGE_KEY = "_LABEL_COLOURS_";

export function loadColoursFromContext(
    context: UFDLServerContext
): LabelColours | undefined {
    const stored = context.get_item(LABEL_COLOUR_STORAGE_KEY, false);

    if (stored === null) return undefined;

    const result: Map<string, LabelColour> = new Map();

    const entriesSerialised = stored.split("\n");

    for (const serialisedEntry of entriesSerialised) {
        const [label, colour] = serialisedEntry.split("|");
        result.set(label, colour);
    }

    return result;
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

    const serialised = mapReduce(
        updated,
        "",
        (current, key, value) => {
            return current + (current === "" ? "" : "\n") + `${key}|${value}`;
        }
    );

    context.store_item(LABEL_COLOUR_STORAGE_KEY, serialised, false);
}
