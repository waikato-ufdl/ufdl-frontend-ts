import "./DatasetItem.css";
import {FunctionComponentReturnType} from "../../util/react/types";
import {Possible} from "../../util/typescript/types/Possible";
import {ReactElement, ReactNode} from "react";
import CenterContent from "../../components/CenterContent";
import {augmentClassName} from "../../util/react/augmentClass";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {DomainAnnotationType, DomainDataType, DomainName} from "../domains";
import {
    MutableDatasetDispatchItem
} from "../hooks/useDataset/DatasetDispatch";
import {TOGGLE} from "../hooks/useDataset/selection";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../hooks/useDataset/types";
import useRenderNotify from "../../util/react/hooks/useRenderNotify";

/** The type of component that renders the raw item data (e.g. images/videos). */
export type DataRenderer<D> = (
    props: {
        filename: string
        selected: boolean
        data: D
    }
) => ReactElement;

export type AnnotationRenderer<A> = (
    filename: string,
    selected: boolean,
    annotation: A,
    evalAnnotation: Possible<A>
) => ReactNode

export type DatasetItemProps<D extends DomainName> = {
    item: MutableDatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>,
    evalAnnotation: Possible<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>,
    renderData: DataRenderer<DatasetDispatchItemDataType<DomainDataType<D>>>
    renderAnnotation: AnnotationRenderer<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>
    onClick: (item: MutableDatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>) => void
    children?: undefined
    className?: string
}

export default function DatasetItem<D extends DomainName>(
    props: DatasetItemProps<D>
): FunctionComponentReturnType {

    useRenderNotify("DatasetItem", props)

    const renderedAnnotation = useDerivedState(
        () => props.renderAnnotation(
            props.item.filename,
            props.item.selected,
            props.item.annotations,
            props.evalAnnotation
        ),
        [props.renderAnnotation, props.item.filename, props.item.selected, props.item.annotations, props.evalAnnotation]
    )

    const onClickContent = useDerivedState(
        () => () => props.onClick(props.item),
        [props.onClick, props.item]
    )

    const onSelect = useDerivedState(
        ([item]) => () => item.setSelected(TOGGLE),
        [props.item]
    )

    return <div className={augmentClassName(props.className, "DatasetItem")}>
        <CenterContent
            className={"DatasetItemRenderedData"}
            onClick={onClickContent}
        >
            <props.renderData
                data={props.item.data}
                filename={props.item.filename}
                selected={props.item.selected}
            />
        </CenterContent>

        {renderedAnnotation}

        <input
            className={"DatasetItemSelectBox"}
            type={"checkbox"}
            checked={props.item.selected}
            onClick={onSelect}
        />
    </div>
}
