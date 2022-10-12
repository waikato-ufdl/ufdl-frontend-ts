import "./DatasetItem.css";
import {FunctionComponentReturnType} from "../../../util/react/types";
import {Absent, Possible} from "../../../util/typescript/types/Possible";
import React, {useEffect} from "react";
import {augmentClassName} from "../../../util/react/augmentClass";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {
    MutableDatasetDispatchItem
} from "../../hooks/useDataset/DatasetDispatch";
import {TOGGLE} from "../../hooks/useDataset/selection";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import CenterContent from "../../../util/react/component/CenterContent";
import {AnnotationComponent, DataComponent } from "./types";

/**
 * The type of properties that the {@link DatasetItem} component takes.
 *
 * @property item
 *          The dataset item to render.
 * @property comparisonAnnotation
 *          An optional comparison annotation to which to compare the primary
 *          item's annotation.
 * @property DataComponent
 *          Component which renders the data of the dataset item.
 * @property AnnotationComponent
 *          Component which renders the annotation of the dataset item.
 * @property onClick
 *          Callback to call when the item is clicked on.
 * @property children
 *          The {@link DatasetItem} component takes no children.
 * @property className
 *          An optional CSS classname to give the component.
 */
export type DatasetItemProps<D extends DomainName> = {
    item: MutableDatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>,
    comparisonAnnotation?: Possible<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>,
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<D>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>
    onClick: (item: MutableDatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>) => void
    children?: undefined
    className?: string
}

/**
 * Component which renders a single item in a dataset.
 *
 * @param props
 *          The props to the component (see {@link DatasetItemProps}).
 */
function DatasetItemComponent<D extends DomainName>(
    {
        item,
        comparisonAnnotation = Absent,
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
                                if (comparisonAnnotation !== Absent && comparisonAnnotation.isIdle) comparisonAnnotation.refetch({cancelRefetch: true})
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
        [ref, item, comparisonAnnotation]
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
            comparisonAnnotation={comparisonAnnotation}
        />

        <input
            className={"DatasetItemSelectBox"}
            type={"checkbox"}
            checked={item.selected}
            onClick={onSelect}
        />
    </div>
}

/**
 * {@link DatasetItemComponent}
 */
export const DatasetItem = React.memo(DatasetItemComponent) as typeof DatasetItemComponent
