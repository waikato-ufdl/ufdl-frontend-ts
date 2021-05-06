import {FunctionComponentReturnType} from "../../../../util/react/types";
import {numberWithSuffix} from "../../../../util/numberWithSuffix";
import React, {CSSProperties} from "react";
import CenterContent from "../../../CenterContent";
import DataImage from "../../../../util/react/component/DataImage";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {Image} from "../../../../server/types/data";
import {Absent, Possible} from "../../../../util/typescript/types/Possible";
import "./ICDatasetItem.css";
import {ClassColours} from "../../../../server/util/classification";
import ClassSelect from "../../../../server/components/classification/ClassSelect";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export type ICDatasetItemProps = {
    item: DatasetItem<Image, Classification>
    evalClass: Possible<Classification>,
    onReclassify: (oldClass: Classification, newClass: Classification) => void
    onSelect: (selected: boolean) => void,
    onImageClick: () => void
    colours: ClassColours
}

export default function ICDatasetItem(
    props: ICDatasetItemProps
): FunctionComponentReturnType {

    const borderWidth = numberWithSuffix(
        props.item.selected ? SELECTED_BORDER_WIDTH_PX : UNSELECTED_BORDER_WIDTH_PX,
        "px"
    );

    const labelColour = props.item.annotations !== NO_CLASSIFICATION
        ? props.colours.get(props.item.annotations)
        : "white";

    const borderStyle: CSSProperties = {
        borderStyle: "solid",
        borderColor: props.evalClass === Absent ?
            labelColour :
            props.evalClass === props.item.annotations ?
                "limegreen" :
                "red"
        ,
        borderWidth: borderWidth + (props.evalClass !== Absent ? 2 : 0)
    };



    return <div className={"ICDatasetItem"}>
        <CenterContent className={"ICDatasetItemBackgroundImage"}>
            <DataImage
                src={props.item.dataCache.getConverted(props.item.dataHandle)}
                onClick={props.onImageClick}
                title={props.item.filename}
            />
        </CenterContent>

        <input
            className={"ICDatasetItemCheckBox"}
            type={"checkbox"}
            checked={props.item.selected}
            onClick={
                () => {
                    props.onSelect(!props.item.selected)
                }
            }
        />

        <ClassSelect
            onReclassify={props.onReclassify}
            classification={props.item.annotations}
            colours={props.colours}
        />

        <div
            className={"ICDatasetItemBorder"}
            style={borderStyle}
        />
    </div>
}