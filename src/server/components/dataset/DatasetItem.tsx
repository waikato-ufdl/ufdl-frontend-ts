import "./DatasetItem.css";
import {FunctionComponentReturnType} from "../../../util/react/types/FunctionComponentReturnType";
import {Absent, Possible} from "../../../util/typescript/types/Possible";
import React, {useEffect} from "react";
import {augmentClassName} from "../../../util/react/augmentClass";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {DatasetDispatchItem, MutableDatasetDispatchItem} from "../../hooks/useDataset/DatasetDispatch";
import {TOGGLE} from "../../hooks/useDataset/selection";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import CenterContent from "../../../util/react/component/CenterContent";
import {AnnotationComponent, DataComponent } from "./types";
import pass from "../../../util/typescript/functions/pass";

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
export type DatasetItemProps<
    Domain extends DomainName,
    Item extends DatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>> = DatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    item: Item,
    comparisonAnnotation?: Possible<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>,
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<Domain>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>
    onClick: (item: Item) => void
    children?: undefined
    className?: string
    disabled?: boolean
}

/**
 * Component which renders a single item in a dataset.
 *
 * @param props
 *          The props to the component (see {@link DatasetItemProps}).
 */
function DatasetItemComponent<
    Domain extends DomainName,
    Item extends DatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>> = DatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(
    {
        item,
        comparisonAnnotation = Absent,
        DataComponent,
        AnnotationComponent,
        onClick,
        className,
        disabled = false
    }: DatasetItemProps<Domain, Item>
): FunctionComponentReturnType {

    const onClickContent = useDerivedState(
        () => () => onClick(item),
        [onClick, item]
    )

    const onSelect = useDerivedState(
        ([item]) => () => {
            if (item instanceof MutableDatasetDispatchItem) item.setSelected(TOGGLE)
        },
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
                                if (!item.data.isFetched) item.data.refetch({ cancelRefetch: false })
                                if (!item.annotations.isFetched) item.annotations.refetch({ cancelRefetch: false })
                                if (comparisonAnnotation !== Absent && !comparisonAnnotation.isFetched) comparisonAnnotation.refetch({ cancelRefetch: false })
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
            onClick={disabled ? pass : onClickContent}
        >
            <DataComponent
                data={item.data}
                filename={item.filename}
                selected={item.selected}
                disabled={disabled}
                className={"DataComponent"}
            />
        </CenterContent>

        <AnnotationComponent
            filename={item.filename}
            selected={item.selected}
            annotation={item.annotations}
            comparisonAnnotation={comparisonAnnotation}
            disabled={disabled}
        />

        <input
            className={"DatasetItemSelectBox"}
            type={"checkbox"}
            checked={item.selected}
            onClick={onSelect}
            disabled={disabled || !(item instanceof MutableDatasetDispatchItem)}
        />
    </div>
}

/**
 * {@link DatasetItemComponent}
 */
export const DatasetItem = React.memo(DatasetItemComponent) as typeof DatasetItemComponent
