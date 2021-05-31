import "./DatasetItem.css";
import {DatasetItem as DatasetItemInfo} from "../types/DatasetItem";
import {FunctionComponentReturnType} from "../../util/react/types";
import {Possible} from "../../util/typescript/types/Possible";
import {ReactElement, ReactNode} from "react";
import CenterContent from "../../components/CenterContent";
import {augmentClassName} from "../../util/react/augmentClass";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import useRenderNotify from "../../util/react/hooks/useRenderNotify";

export type DataRenderer<D> = (
    filename: string,
    selected: boolean,
    data: DatasetItemInfo<D, unknown>['data']
) => ReactElement;

export type AnnotationRenderer<A> = (
    filename: string,
    selected: boolean,
    annotation: DatasetItemInfo<unknown, A>['annotations'],
    evalAnnotation: Possible<DatasetItemInfo<unknown, A>['annotations']>
) => ReactNode

export type DatasetItemProps<D, A> = {
    item: DatasetItemInfo<D, A>,
    evalAnnotation: Possible<DatasetItemInfo<unknown, A>['annotations']>,
    renderData: DataRenderer<D>
    renderAnnotation: AnnotationRenderer<A>
    onSelect: (item: DatasetItemInfo<D, A>) => void,
    onClick: (item: DatasetItemInfo<D, A>) => void
    children?: undefined
    className?: string
}

export default function DatasetItem<D, A>(
    props: DatasetItemProps<D, A>
): FunctionComponentReturnType {

    //useRenderNotify("DatasetItem", props)

    const renderedData = useDerivedState(
        () => props.renderData(
            props.item.filename,
            props.item.selected,
            props.item.data
        ),
        [props.renderData, props.item.filename, props.item.selected, props.item.data]
    )

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
        () => () => props.onSelect(props.item),
        [props.onSelect, props.item]
    )

    return <div className={augmentClassName(props.className, "DatasetItem")}>
        <CenterContent
            className={"DatasetItemRenderedData"}
            onClick={onClickContent}
        >
            {renderedData}
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
