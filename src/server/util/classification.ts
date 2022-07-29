import CSS from "csstype";
import {mapToArray, spreadJoinMaps} from "../../util/map";
import {toHexString} from "ufdl-ts-client/util";
import {pseudoRandomBytes} from "crypto";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {Classification, NO_ANNOTATION, OptionalAnnotations} from "../types/annotations";
import {Dataset} from "../types/Dataset";
import {DatasetItem} from "../types/DatasetItem";

export type ClassColour = CSS.Property.BackgroundColor & CSS.Property.BorderColor

export type ClassColours = ReadonlyMap<string, ClassColour>

const CLASS_COLOURS_STORAGE_KEY = "_CLASS_COLOURS_";

export function asLabel<N>(
    classification: OptionalAnnotations<Classification>,
    whenNoClassification: N
): Classification | N {
    if (classification === "" || classification === NO_ANNOTATION)
        return whenNoClassification;
    return classification;
}

export function asClassification(
    value: any
): OptionalAnnotations<Classification> {
    if (typeof value !== "string" || value === "")
        return NO_ANNOTATION;
    return value;
}

export function sortedClassColourArray(
    labelColours: ClassColours
): [string, ClassColour][] {
    let arr: [string, ClassColour][] = mapToArray(
        labelColours,
        (key, value) => [key, value]
    );

    arr.sort(
        (a, b) => {
            return a[0].localeCompare(b[0])
        }
    );

    return arr;
}

export function ensureColoursFor(
    labelColours: ClassColours,
    ...labels: string[]
): ClassColours {
    const newColours = new Map<string, ClassColour>();

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

export function pickNewRandomColour(
    labelColours: ClassColours
): string {
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

export function loadColoursFromContext(
    context: UFDLServerContext
): ClassColours | undefined {
    const stored = context.get_item(CLASS_COLOURS_STORAGE_KEY, false);

    if (stored === null) return undefined;

    const storedJSON: [string, ClassColour][] = JSON.parse(stored);

    return new Map(storedJSON);
}

export function storeColoursInContext(
    labelColours: ClassColours,
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

    context.store_item(CLASS_COLOURS_STORAGE_KEY, JSON.stringify(serialised), false);
}
