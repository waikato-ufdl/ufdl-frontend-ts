import "./DatasetItem.css";
import {DatasetItem} from "../types/DatasetItem";
import {FunctionComponentReturnType} from "../../util/react/types";
/*
export const SELECTED_BORDER_WIDTH_PX: number = 3;
export const UNSELECTED_BORDER_WIDTH_PX: number = 2;

export type DatasetItemFileRenderer<D, A> = (
    props: {
        item: DatasetItem<D, A>
    }
) => FunctionComponentReturnType;

export type DatasetItemProps = {
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

export default function ICDatasetItem(
    props: ICDatasetItemProps
): FunctionComponentReturnType {

    const borderWidth = numberWithSuffix(
        props.selected ? SELECTED_BORDER_WIDTH_PX : UNSELECTED_BORDER_WIDTH_PX,
        "px"
    );

    const labelColour = props.label !== undefined ? props.labelColours.get(props.label) : "white";

    const borderStyle: CSSProperties = {
        borderStyle: "solid",
        borderColor: props.evalLabel === NO_EVAL_LABEL ?
            labelColour :
            props.evalLabel === props.label ?
                "limegreen" :
                "red"
        ,
        borderWidth: borderWidth + (props.evalLabel !== NO_EVAL_LABEL ? 2 : 0)
    };

    return <div className={"ICDatasetItem"}>
        <CenterContent className={"ICDatasetItemBackgroundImage"}>
            <DataImage
                src={props.imageData}
                onClick={props.onImageClick}
                title={props.filename}
            />
        </CenterContent>

        <input
            className={"ICDatasetItemCheckBox"}
            type={"checkbox"}
            checked={props.selected}
            onClick={
                () => {
                    props.onSelect(!props.selected)
                }
            }
        />

        <LabelSelect
            onRelabelled={props.onRelabelled}
            label={props.label}
            labelColours={props.labelColours}
        />

        <div
            className={"ICDatasetItemBorder"}
            style={borderStyle}
        />
    </div>
}*/
