import React from "react";
import {Dataset} from "../types/Dataset";
import {DatasetItem as DatasetItemInfo} from "../types/DatasetItem";
import {handleDefaults, PropsDefaultHandlers, WithDefault} from "../../util/typescript/default";
import {CompareFunction} from "../../util/typescript/sort/CompareFunction";
import {FlexItemProps} from "../../util/react/component/flex/FlexItem";
import {constantInitialiser} from "../../util/typescript/initialisers";
import {mapToArray} from "../../util/map";
import FlexContainer from "../../util/react/component/flex/FlexContainer";
import AddFilesButton, {FileAnnotationModalRenderer} from "./AddFilesButton";
import {undefinedAsAbsent} from "../../util/typescript/types/Possible";
import DatasetItem, {AnnotationRenderer, DataRenderer} from "./DatasetItem";
import {augmentClassName} from "../../util/augmentClass";

export type DatasetOverviewProps<D, A> = {
    dataset: Dataset<D, A> | undefined
    evalDataset: Dataset<D, A> | undefined
    renderData: DataRenderer<D>
    renderAnnotation: AnnotationRenderer<A>
    onItemSelected: (item: DatasetItemInfo<D, A>) => void
    onItemClicked: (item: DatasetItemInfo<D, A>) => void
    onAddFiles: (files: ReadonlyMap<string, [Blob, A]>) => void
    sortFunction: WithDefault<CompareFunction<DatasetItemInfo<D, A>> | undefined>
    itemClass: WithDefault<string | undefined>
    fileAnnotationModalRenderer: FileAnnotationModalRenderer<A>
    className?: string
}

const DEFAULT_HANDLERS: PropsDefaultHandlers<DatasetOverviewProps<any, any>> = {
    sortFunction: constantInitialiser(undefined),
    itemClass: constantInitialiser(undefined)
};

const ITEM_STYLE: FlexItemProps["style"] = {
    margin: "1.25%",
    border: 0,
    padding: 0,
    height: "16.3125%",
    overflow: "hidden",
    flexGrow: 0,
    width: "22.5%"
};

const ITEM_PROPS = {style: ITEM_STYLE};

const GET_ITEM_PROPS = constantInitialiser(ITEM_PROPS);

const FLEX_CONTAINER_STYLE = {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "initial",
    alignContent: "flex-start"
} as const

export default function DatasetOverview<D, A>(
    props: DatasetOverviewProps<D, A>
) {
    // Handle the default values for the props
    const propsDef = handleDefaults(props, DEFAULT_HANDLERS);

    // Extract the dataset items, if any
    const items: DatasetItemInfo<D, A>[]
        = propsDef.dataset === undefined
        ? []
        : mapToArray(
            propsDef.dataset,
            (_filename, item) => item
        );

    // Sort them according to the given sort function
    if (propsDef.sortFunction !== undefined) items.sort(propsDef.sortFunction);

    // Create a display item for each dataset item
    const renderedItems = items.map(
        (item) => {
            return <DatasetItem<D, A>
                key={item.filename}
                item={item}
                evalAnnotation={undefinedAsAbsent(props.evalDataset?.get(item.filename)?.annotations)}
                renderData={props.renderData}
                renderAnnotation={props.renderAnnotation}
                onSelect={props.onItemSelected}
                onClick={props.onItemClicked}
                className={propsDef.itemClass}
            />
        }
    );

    return <FlexContainer
        className={augmentClassName(props.className, "DatasetOverview")}
        itemProps={GET_ITEM_PROPS}
        style={FLEX_CONTAINER_STYLE}
    >
        <AddFilesButton<A>
            disabled={props.dataset === undefined}
            onSelected={props.onAddFiles}
            annotationModal={props.fileAnnotationModalRenderer}
        />
        {renderedItems}
    </FlexContainer>

}