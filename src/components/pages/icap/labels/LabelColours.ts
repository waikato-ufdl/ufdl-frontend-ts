import CSS from "csstype";
import {mapToArray, spreadJoinMaps} from "../../../../util/map";
import {toHexString} from "ufdl-js-client/util";
import {pseudoRandomBytes} from "crypto";

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