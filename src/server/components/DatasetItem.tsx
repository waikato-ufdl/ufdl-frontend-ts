import "./DatasetItem.css";
import {FunctionComponentReturnType} from "../../util/react/types";
import {Absent, Possible} from "../../util/typescript/types/Possible";
import React, {ReactElement, ReactNode, useEffect} from "react";
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

    const ref = React.createRef<HTMLDivElement>();

    useEffect(
        () => {
            const itemDiv = ref.current;
            const item = props.item;
            const evalAnnotation = props.evalAnnotation

            if (itemDiv === null) return;

            var observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(
                        entry => {
                            if (entry.target !== itemDiv) return;
                            if (entry.isIntersecting) {
                                if (item.data.isIdle) item.data.refetch({cancelRefetch: true})
                                if (item.annotations.isIdle) item.annotations.refetch({cancelRefetch: true})
                                if (evalAnnotation !== Absent && evalAnnotation.isIdle) evalAnnotation.refetch({cancelRefetch: true})
                                observer.unobserve(entry.target)
                            }
                        }
                    );
                },
                { root: null, rootMargin: "50%", threshold: 0 }
            );

            observer.observe(itemDiv);

            return () => { observer.unobserve(itemDiv) }
        },
        [ref, props.item, props.evalAnnotation]
    )

    return <div
        className={augmentClassName(props.className, "DatasetItem")}
        ref={ref}
    >
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
