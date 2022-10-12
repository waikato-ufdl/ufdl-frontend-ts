import "./DatasetItem.css";
import {FunctionComponent, FunctionComponentReturnType} from "../../util/react/types";
import {Absent, Possible} from "../../util/typescript/types/Possible";
import React, {useEffect} from "react";
import {augmentClassName} from "../../util/react/augmentClass";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {DomainAnnotationType, DomainDataType, DomainName} from "../domains";
import {
    MutableDatasetDispatchItem
} from "../hooks/useDataset/DatasetDispatch";
import {TOGGLE} from "../hooks/useDataset/selection";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../hooks/useDataset/types";
import CenterContent from "../../util/react/component/CenterContent";

/** The type of component that renders the raw item data (e.g. images/videos). */
export type DataComponent<D> = FunctionComponent<{
    filename: string
    selected: boolean
    data: D
}>

export type AnnotationComponent<A> = FunctionComponent<{
    filename: string,
    selected: boolean,
    annotation: A,
    evalAnnotation: Possible<A>
}>

export type DatasetItemProps<D extends DomainName> = {
    item: MutableDatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>,
    evalAnnotation: Possible<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>,
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<D>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>
    onClick: (item: MutableDatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>) => void
    children?: undefined
    className?: string
}

export default function DatasetItem<D extends DomainName>(
    {
        item,
        evalAnnotation,
        DataComponent,
        AnnotationComponent,
        onClick,
        className
    }: DatasetItemProps<D>
): FunctionComponentReturnType {

    const onClickContent = useDerivedState(
        () => () => onClick(item),
        [onClick, item]
    )

    const onSelect = useDerivedState(
        ([item]) => () => item.setSelected(TOGGLE),
        [item]
    )

    const ref = React.createRef<HTMLDivElement>();

    useEffect(
        () => {
            const itemDiv = ref.current;

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
        [ref, item, evalAnnotation]
    )

    return <div
        className={augmentClassName(className, "DatasetItem")}
        ref={ref}
    >
        <CenterContent
            className={"DatasetItemRenderedData"}
            onClick={onClickContent}
        >
            <DataComponent
                data={item.data}
                filename={item.filename}
                selected={item.selected}
            />
        </CenterContent>

        <AnnotationComponent
            filename={item.filename}
            selected={item.selected}
            annotation={item.annotations}
            evalAnnotation={evalAnnotation}
        />

        <input
            className={"DatasetItemSelectBox"}
            type={"checkbox"}
            checked={item.selected}
            onClick={onSelect}
        />
    </div>
}
