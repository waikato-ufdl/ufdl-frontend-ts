import {ClassColours} from "../../util/classification";
import {Classification, NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
import {AnnotationComponent} from "../DatasetItem";
import {numberWithSuffix} from "../../../util/numberWithSuffix";
import React, {CSSProperties} from "react";
import {Absent} from "../../../util/typescript/types/Possible";
import ClassSelect from "./ClassSelect";
import isSuccess from "../../../util/react/query/isSuccess";
import hasData from "../../../util/react/query/hasData";
import {DatasetDispatchItemAnnotationType} from "../../hooks/useDataset/types";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export default function createClassificationComponent(
    colours: ClassColours,
    onReclassify: (filename: string, oldClass: OptionalAnnotations<Classification> | undefined, newClass: OptionalAnnotations<Classification>) => void
): AnnotationComponent<DatasetDispatchItemAnnotationType<Classification>> {
    return (
        {
            filename,
            selected,
            annotation: classification,
            evalAnnotation: evalClassification
        }
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
            borderColor: evalClassification === Absent || !isSuccess(classification)
                ? labelColour
                : isSuccess(evalClassification)
                    ? evalClassification.data === classification.data
                        ? "limegreen"
                        : "red"
                    : "black"
            ,
            borderWidth: borderWidth + (evalClassification !== Absent ? 2 : 0)
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
                noAnnotationLabel={"[NONE]"}
            />

            <div
                className={"DatasetItemBorder"}
                style={borderStyle}
            />
        </>
    }
}