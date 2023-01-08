import React from "react";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";
import {SubMenus} from "../AddFilesButton";
import {DatasetItem} from "./DatasetItem";
import {DomainSortOrderFunction} from "../types";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {
    DatasetDispatch,
    MutableDatasetDispatch, MutableDatasetDispatchItem
} from "../../hooks/useDataset/DatasetDispatch";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import { ExpandedComponent, DataComponent, AnnotationComponent } from "./types";
import DefaultDatasetOverview from "./DefaultDatasetOverview";
import {augmentClassName} from "../../../util/react/augmentClass";
import SingleItemDatasetOverview from "./SingleItemDatasetOverview";
import MultiItemDatasetOverview from "./MultiItemDatasetOverview";
import ExampleDatasetOverview from "./ExampleDatasetOverview";

/**
 * Props to the {@link DatasetOverview} component.
 *
 * @property dataset
 *          The dataset with which to work. The overview is empty if this is undefined.
 * @property comparisonDataset
 *          An optional dataset against which to compare items in the primary dataset.
 * @property DataComponent
 *          Component which renders the data-type of the domain.
 * @property AnnotationComponent
 *          Component which renders the annotation-type of the domain.
 * @property ExpandedComponent
 *          Component to render the expanded view of an item. Default is just an enlarged
 *          {@link DatasetItem}.
 * @property sortFunction
 *          An optional function to sort the dataset items. By default items are unsorted.
 * @property addFilesSubMenus
 *          The methods for adding new items to the dataset.
 * @property className
 *          An optional CSS-classname.
 */
export type DatasetOverviewProps<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    dataset: MutableDatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>, Item> | undefined
    comparisonDataset?: DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<Domain>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>
    ExpandedComponent?: ExpandedComponent<Domain, Item>
    sortFunction?: WithDefault<DomainSortOrderFunction<Domain>>
    addFilesSubMenus: SubMenus<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    className?: string
    mode?: typeof DEFAULT | "Single" | "Multi" | "Example"
}

export default function DatasetOverview<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(
    {
        dataset,
        comparisonDataset,
        DataComponent,
        AnnotationComponent,
        ExpandedComponent =
                props => <DatasetItem<Domain>
                    item={props.item}
                    comparisonAnnotation={props.comparisonAnnotation}
                    DataComponent={DataComponent}
                    AnnotationComponent={AnnotationComponent}
                    onClick={props.collapse}
                />,
        sortFunction = DEFAULT,
        addFilesSubMenus,
        className,
        mode = DEFAULT
    }: DatasetOverviewProps<Domain, Item>
) {
    switch (mode) {
        case DEFAULT:
            return <DefaultDatasetOverview
                dataset={dataset}
                comparisonDataset={comparisonDataset}
                DataComponent={DataComponent}
                AnnotationComponent={AnnotationComponent}
                ExpandedComponent={ExpandedComponent}
                sortFunction={sortFunction}
                addFilesSubMenus={addFilesSubMenus}
                className={augmentClassName(className, "DatasetOverview")}
            />

        case "Single":
            return <SingleItemDatasetOverview
                dataset={dataset}
                comparisonDataset={comparisonDataset}
                DataComponent={DataComponent}
                AnnotationComponent={AnnotationComponent}
                ExpandedComponent={ExpandedComponent}
                sortFunction={sortFunction}
                className={augmentClassName(className, "DatasetOverview")}
            />

        case "Multi":
            return <MultiItemDatasetOverview
                dataset={dataset}
                comparisonDataset={comparisonDataset}
                DataComponent={DataComponent}
                AnnotationComponent={AnnotationComponent}
                ExpandedComponent={ExpandedComponent}
                sortFunction={sortFunction}
                className={augmentClassName(className, "DatasetOverview")}
            />

        case "Example":
            return <ExampleDatasetOverview
                dataset={dataset}
                comparisonDataset={comparisonDataset}
                DataComponent={DataComponent}
                AnnotationComponent={AnnotationComponent}
                ExpandedComponent={ExpandedComponent}
                sortFunction={sortFunction}
                className={augmentClassName(className, "DatasetOverview")}
            />
    }
}