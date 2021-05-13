import {FunctionComponentReturnType} from "../../../../util/react/types";
import {numberWithSuffix} from "../../../../util/numberWithSuffix";
import React, {CSSProperties} from "react";
import {DatasetItem as DatasetItemInfo} from "../../../../server/types/DatasetItem";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {Image} from "../../../../server/types/data";
import {Absent, Possible} from "../../../../util/typescript/types/Possible";
import "./ICDatasetItem.css";
import {ClassColours} from "../../../../server/util/classification";
import ClassSelect from "../../../../server/components/classification/ClassSelect";
import {PartialResult} from "../../../../util/typescript/result";
import DatasetItem, {AnnotationRenderer} from "../../../../server/components/DatasetItem";
import {ImageRenderer} from "../../../../server/components/image/ImageRenderer";
import useRenderNotify from "../../../../util/react/hooks/useRenderNotify";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export type ICDatasetItemProps = {
    item: DatasetItemInfo<Image, Classification>
    evalClass: Possible<PartialResult<Classification>>,
    onReclassify: (filename: string, oldClass: Classification, newClass: Classification) => void
    onSelect: (item: DatasetItemInfo<Image, Classification>) => void,
    onClick: (item: DatasetItemInfo<Image, Classification>) => void
    colours: ClassColours
}

function createAnnotationRenderer(
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

export default function ICDatasetItem(
    props: ICDatasetItemProps
): FunctionComponentReturnType {

    useRenderNotify("ICDatasetItem", props);

    const annotationRenderer = useDerivedState(
        () => createAnnotationRenderer(props.colours, props.onReclassify),
        [props.colours, props.onReclassify]
    )

    return <DatasetItem<Image, Classification>
        item={props.item}
        evalAnnotation={props.evalClass}
        renderData={ImageRenderer}
        renderAnnotation={annotationRenderer}
        onSelect={props.onSelect}
        onClick={props.onClick}
        className={"ICDatasetItem"}
    />
}
