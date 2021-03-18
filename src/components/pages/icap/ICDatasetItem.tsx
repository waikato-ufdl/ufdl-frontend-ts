import React, {CSSProperties} from "react";
import {DataImage} from "../../../image/DataImage";
import {BehaviorSubject} from "rxjs";
import "./ICDatasetItem.css";
import CenterContent from "../../CenterContent";
import {numberWithSuffix} from "../../../util/numberWithSuffix";
import {LabelColours} from "./labels/LabelColours";
import LabelSelect from "./labels/LabelSelect";

export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export type ICDatasetItemProps = {
    filename: string
    imageData: BehaviorSubject<Blob>
    label: string | undefined
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

        const borderStyle: CSSProperties = this.props.label !== undefined ?
            {
                borderStyle: "solid",
                borderColor: this.props.labelColours.get(this.props.label),
                borderWidth: borderWidth
            } :
            {};

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