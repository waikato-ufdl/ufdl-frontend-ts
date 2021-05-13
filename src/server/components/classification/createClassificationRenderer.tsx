import {ClassColours} from "../../util/classification";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import {AnnotationRenderer} from "../DatasetItem";
import {numberWithSuffix} from "../../../util/numberWithSuffix";
import React, {CSSProperties} from "react";
import {Absent} from "../../../util/typescript/types/Possible";
import ClassSelect from "./ClassSelect";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export default function createClassificationRenderer(
    colours: ClassColours,
    onReclassify: (filename: string, oldClass: Classification, newClass: Classification) => void
): AnnotationRenderer<Classification> {
    return (
        filename,
        selected,
        classification,
        evalClass
    ) => {

        const borderWidth = numberWithSuffix(
            selected
                ? SELECTED_BORDER_WIDTH_PX
                : UNSELECTED_BORDER_WIDTH_PX,
            "px"
        );

        const labelColour = !classification.success
            ? "black"
            : classification.value !== NO_CLASSIFICATION
                ? colours.get(classification.value)
                : "white";

        const borderStyle: CSSProperties = {
            borderStyle: "solid",
            borderColor: evalClass === Absent || !classification.success
                ? labelColour
                : evalClass.success
                    ? evalClass.value === classification.value
                        ? "limegreen"
                        : "red"
                    : "black"
            ,
            borderWidth: borderWidth + (evalClass !== Absent ? 2 : 0)
        };

        const label = classification.success
            ? classification.value
            : classification.success === undefined
                ? classification.partialResult
                : NO_CLASSIFICATION

        return <>
            <ClassSelect
                onReclassify={(oldClass, newClass) => onReclassify(filename, oldClass, newClass)}
                classification={label}
                colours={colours}
                disabled={!classification.success}
                allowSelectNone
            />

            <div
                className={"ICDatasetItemBorder"}
                style={borderStyle}
            />
        </>
    }
}