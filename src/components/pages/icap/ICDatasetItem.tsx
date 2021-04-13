import React, {CSSProperties} from "react";
import DataImage from "../../../util/react/component/DataImage";
import {BehaviorSubject} from "rxjs";
import "./ICDatasetItem.css";
import CenterContent from "../../CenterContent";
import {numberWithSuffix} from "../../../util/numberWithSuffix";
import {LabelColours} from "./labels/LabelColours";
import LabelSelect from "./labels/LabelSelect";
import {EvalLabel, NO_EVAL_LABEL} from "../../../server/hooks/useImageClassificationDataset/eval";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export type ICDatasetItemProps = {
    filename: string
    imageData: BehaviorSubject<Blob> | BehaviorSubject<string> | Blob | string
    label: string | undefined,
    evalLabel: EvalLabel,
    onRelabelled: (oldLabel?: string, newLabel?: string) => void
    selected: boolean
    onSelect: (selected: boolean) => void,
    onImageClick: () => void
    labelColours: LabelColours
}

export type ICDatasetItemState = {
}

export class ICDatasetItem extends React.Component<ICDatasetItemProps, ICDatasetItemState>{

    render() {
        const borderWidth = numberWithSuffix(
            this.props.selected ? SELECTED_BORDER_WIDTH_PX : UNSELECTED_BORDER_WIDTH_PX,
            "px"
        );

        const labelColour = this.props.label !== undefined ? this.props.labelColours.get(this.props.label) : "white";

        const borderStyle: CSSProperties = {
                borderStyle: "solid",
                borderColor: this.props.evalLabel === NO_EVAL_LABEL ?
                    labelColour :
                    this.props.evalLabel === this.props.label ?
                        "limegreen" :
                        "red"
                ,
                borderWidth: borderWidth + (this.props.evalLabel !== NO_EVAL_LABEL ? 2 : 0)
            };

        return <div className={"ICDatasetItem"}>
            <CenterContent className={"ICDatasetItemBackgroundImage"}>
                <DataImage
                    src={this.props.imageData}
                    onClick={this.props.onImageClick}
                    title={this.props.filename}
                />
            </CenterContent>

            <input
                className={"ICDatasetItemCheckBox"}
                type={"checkbox"}
                checked={this.props.selected}
                onClick={
                    () => {
                        this.props.onSelect(!this.props.selected)
                    }
                }
            />

            <LabelSelect
                onRelabelled={this.props.onRelabelled}
                label={this.props.label}
                labelColours={this.props.labelColours}
            />

            <div
                className={"ICDatasetItemBorder"}
                style={borderStyle}
            />
        </div>
    }

}