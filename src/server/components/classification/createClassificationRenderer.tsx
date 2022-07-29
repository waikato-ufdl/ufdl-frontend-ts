import {ClassColours} from "../../util/classification";
import {Classification, NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
import {AnnotationRenderer} from "../DatasetItem";
import {numberWithSuffix} from "../../../util/numberWithSuffix";
import React, {CSSProperties} from "react";
import {Absent} from "../../../util/typescript/types/Possible";
import ClassSelect from "./ClassSelect";
import isSuccess from "../../../util/react/query/isSuccess";
import hasData from "../../../util/react/query/hasData";
import {DatasetDispatchItemAnnotationType} from "../../hooks/useDataset/types";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export default function createClassificationRenderer(
    colours: ClassColours,
    onReclassify: (filename: string, oldClass: OptionalAnnotations<Classification>, newClass: OptionalAnnotations<Classification>) => void
): AnnotationRenderer<DatasetDispatchItemAnnotationType<Classification>> {
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

        const labelColour = isSuccess(classification)
            ? classification.data !== NO_ANNOTATION
                ? colours.get(classification.data)
                : "white"
            : "black"

        const borderStyle: CSSProperties = {
            borderStyle: "solid",
            borderColor: evalClass === Absent || !isSuccess(classification)
                ? labelColour
                : isSuccess(evalClass)
                    ? evalClass.data === classification.data
                        ? "limegreen"
                        : "red"
                    : "black"
            ,
            borderWidth: borderWidth + (evalClass !== Absent ? 2 : 0)
        };

        const label = hasData(classification)
            ? classification.data
            : NO_ANNOTATION

        return <>
            <ClassSelect
                onReclassify={(oldClass, newClass) => onReclassify(filename, oldClass, newClass)}
                classification={label}
                colours={colours}
                disabled={!isSuccess(classification)}
                allowSelectNone
            />

            <div
                className={"DatasetItemBorder"}
                style={borderStyle}
            />
        </>
    }
}