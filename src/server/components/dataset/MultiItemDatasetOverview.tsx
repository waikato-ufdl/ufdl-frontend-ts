import React, {useEffect} from "react";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";
import {FlexItemProps} from "../../../util/react/component/flex/FlexItem";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import FlexContainer from "../../../util/react/component/flex/FlexContainer";
import {undefinedAsAbsent} from "../../../util/typescript/types/Possible";
import {DatasetItem as DatasetItemComponent} from "./DatasetItem";
import {augmentClassName} from "../../../util/react/augmentClass";
import {DomainSortOrderFunction} from "../types";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {
    DatasetDispatch,
    DatasetDispatchItem,
    MutableDatasetDispatch,
    MutableDatasetDispatchItem
} from "../../hooks/useDataset/DatasetDispatch";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import {AnnotationComponent, DataComponent, ExpandedComponent} from "./types";
import useDerivedReducer from "../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../util/react/hooks/SimpleStateReducer";
import {DatasetItem} from "../../types/DatasetItem";
import {Equivalency, tripleEquals} from "../../../util/equivalency";
import hasData from "../../../util/react/query/hasData";
import {OptionalAnnotations} from "../../types/annotations";
import randomSubset from "../../../util/typescript/random/randomSubset";
import pass from "../../../util/typescript/functions/pass";
import "./MultiItemDatasetOverview.css"
import {all} from "../../../util/typescript/all";
import {mapMap} from "../../../util/map";
import {identity} from "../../../util/identity";
import range from "../../../util/typescript/range";
import {discard} from "../../../util/typescript/discard";

/**
 * Props to the {@link MultiItemDatasetOverview} component.
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
export type MultiItemDatasetOverviewProps<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    dataset: MutableDatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>, Item> | undefined
    comparisonDataset?: DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<Domain>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>
    ExpandedComponent?: ExpandedComponent<Domain, Item>
    sortFunction?: WithDefault<DomainSortOrderFunction<Domain>>
    className?: string
    comparison?: Equivalency<OptionalAnnotations<DomainAnnotationType<Domain>>>
}

// TODO: Move to CSS
const SAMPLE_STYLE: FlexItemProps["style"] = {
    marginLeft: "1.667%",
    marginRight: "1.667%",
    border: 0,
    padding: 0,
    height: "100%",
    overflow: "hidden",
    flexGrow: 0,
    width: "30%"
};

// TODO: Move to CSS
const SAMPLE_PROPS = {style: SAMPLE_STYLE};

// TODO: Move to CSS
const GET_SAMPLE_PROPS = constantInitialiser(SAMPLE_PROPS);

// TODO: Move to CSS
const FLEX_CONTAINER_STYLE = {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "initial",
    alignContent: "flex-start"
} as const

export default function MultiItemDatasetOverview<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(
    {
        dataset,
        comparisonDataset,
        DataComponent,
        AnnotationComponent,
        ExpandedComponent =
            props => <DatasetItemComponent<Domain>
                item={props.item}
                comparisonAnnotation={props.comparisonAnnotation}
                DataComponent={DataComponent}
                AnnotationComponent={AnnotationComponent}
                onClick={props.collapse}
            />,
        sortFunction = DEFAULT,
        className,
        comparison
    }: MultiItemDatasetOverviewProps<Domain, Item>
) {
    // Extract the dataset items, if any
    const items = dataset !== undefined
        ? [...dataset.values()]
        : []

    // Sort them according to the given sort function
    if (sortFunction !== DEFAULT) items.sort(sortFunction)

    const examples = useExamples(
        items,
        comparisonDataset,
        comparison,
        3
    )

    const [expanded, setExpanded] = useDerivedReducer(
        createSimpleStateReducer<string | undefined>(),
        (items, current) => items.find(item => item.filename === current)?.filename,
        items
    )

    const onItemClicked = useDerivedState(
        ([setExpanded]) => {
            return (item: DatasetItem<unknown, unknown>) => {
                setExpanded(item.filename)
            }
        },
        [setExpanded] as const
    )

    const collapse = useDerivedState(
        ([setExpanded]) => {
            return () => setExpanded(undefined)
        },
        [setExpanded] as const
    )

    if (expanded !== undefined) {
        return <ExpandedComponent
            item={items.find(item => item.filename === expanded)!}
            comparisonAnnotation={undefinedAsAbsent(comparisonDataset?.get(expanded)?.annotations)}
            collapse={collapse}
            disabled={false}
        />
    }

    // Create a display item for each dataset item
    const renderedItems = items.map(
        item => <DatasetItemComponent<Domain>
            key={item.filename}
            item={item}
            DataComponent={DataComponent}
            AnnotationComponent={AnnotationComponent}
            onClick={onItemClicked}
        />
    )

    const renderedExamples = items.map(
        item => {
            const itemExamples = examples.get(item.filename)!

            return <FlexContainer
                className={"SampleRow"}
                itemProps={GET_SAMPLE_PROPS}
                style={FLEX_CONTAINER_STYLE}
            >
                {
                    itemExamples.map(
                        example => <DatasetItemComponent<Domain>
                            key={example.filename}
                            item={example}
                            DataComponent={DataComponent}
                            AnnotationComponent={AnnotationComponent}
                            onClick={pass}
                            disabled
                        />
                    )
                }
            </FlexContainer>
        }
    )

    return <FlexContainer
        className={augmentClassName(className, "MultiItemDatasetOverview")}
        itemProps={
            (_, index) => {
                return {
                    style: {
                        margin: 0,
                        border: 0,
                        padding: 0,
                        height: "100%",
                        flexGrow: 0,
                        width: index === 0 ? "75%" : "25%"
                    }
                };
            }
        }
        style={
            {
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "flex-start",
                justifyContent: "initial",
                alignContent: "flex-start"
            }
        }
    >
        <FlexContainer
            className={"Samples"}
            itemProps={
                () => {
                    return {
                        style: {
                            margin: 0,
                            border: 0,
                            paddingTop: "1.667%",
                            paddingBottom: "1.667%",
                            height: "16.3125%",
                            overflow: "hidden",
                            flexGrow: 0,
                            width: "100%",
                            borderRight: "1px solid black",
                            borderBottom: "1px solid black"
                        }
                    }
                }
            }
            style={FLEX_CONTAINER_STYLE}
        >
            {renderedExamples}
        </FlexContainer>
        <FlexContainer
            className={"Items"}
            itemProps={
                () => {
                    return {
                        style: {
                            margin: 0,
                            border: 0,
                            padding: "5%",
                            height: "16.3125%",
                            overflow: "hidden",
                            flexGrow: 0,
                            width: "90%",
                            borderBottom: "1px solid black"
                        }
                    }
                }
            }
            style={FLEX_CONTAINER_STYLE}
        >
            {renderedItems}
        </FlexContainer>
    </FlexContainer>

}

function useExamples<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(
    items: readonly Item[],
    comparisonDataset?: DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>>,
    comparison: Equivalency<OptionalAnnotations<DomainAnnotationType<Domain>>> = tripleEquals,
    numExamples: number = 3
): ReadonlyMap<string, readonly DatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>[]> {

    // Trigger fetching of the comparison annotations as we need them loaded for comparison
    // against the items' annotations.
    useEffect(
        () => {
            if (comparisonDataset === undefined) return
            for (const { annotations } of comparisonDataset.values()) {
                if (annotations.isIdle) discard(annotations.refetch({cancelRefetch: false}))
            }
        },
        [comparisonDataset]
    )

    // Check that the number of examples is a non-negative integer
    if (!Number.isInteger(numExamples) || numExamples < 0) {
        throw new Error(`numExamples must be a non-negative integer, got ${numExamples}`)
    }

    const [exampleFilenames] = useDerivedReducer(
        createSimpleStateReducer<ReadonlyMap<string, readonly string[]>>(),
        createUseSamplesInitialiser<Domain, Item>(),
        [items, comparisonDataset, comparison, numExamples] as const,
        () => new Map()
    )

    // (defined assertions: if comparisonDataset is undefined, all examples arrays will be empty,
    //  so map-function won't be called. Otherwise, the initialiser above ensures that all examples
    //  are valid keys in the comparisonDataset).
    return mapMap(
        exampleFilenames,
        (filename, examples) => [[filename, examples.map(example => comparisonDataset!.get(example)!)]]
    )
}

function createUseSamplesInitialiser<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(): (
    args: readonly [
        readonly Item[],
        DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>> | undefined,
        Equivalency<OptionalAnnotations<DomainAnnotationType<Domain>>>,
        number
    ],
    currentState: ReadonlyMap<string, readonly string[]>
) => ReadonlyMap<string, readonly string[]> {

    return (
        [items, comparisonDataset, comparison, numExamples],
        currentState
    ) => {
        const nextState = new Map<string, readonly string[]>()

        const loadingAnnotations = comparisonDataset !== undefined && !all(
            item => hasData(item.annotations),
            ...comparisonDataset.values()
        )

        for (const item of items) {
            const filename = item.filename
            const annotations = item.annotations

            // If the item is still loading its annotation data, it should have no examples.
            // Also, if there are no comparison items, all items will have 0 examples.
            if (comparisonDataset === undefined || !hasData(annotations)) {
                nextState.set(filename, [])
                continue
            }

            const currentSelections = currentState.get(filename)
            const stillValidSelections: (string | undefined)[] = currentSelections === undefined
                ? []
                : [...currentSelections]

            // Remove any selections that are no longer valid
            for (const index of range(stillValidSelections.length)) {
                const selection = stillValidSelections[index]
                const comparisonItem = selection !== undefined
                    ? comparisonDataset.get(selection)
                    : undefined

                if (
                    comparisonItem === undefined
                    ||
                    !hasData(comparisonItem.annotations)
                    ||
                    !comparison(annotations.data, comparisonItem.annotations.data)
                ) {
                    stillValidSelections[index] = undefined
                }
            }

            // Remove the [undefined]s we inserted over the invalid examples
            const updatedSelections = stillValidSelections.filter(value => value !== undefined) as string[]

            // If we're still loading annotations, don't pick any new examples yet.
            // Furthermore, if we already have enough examples, return them
            if (loadingAnnotations || updatedSelections.length >= numExamples) {
                nextState.set(filename, updatedSelections.slice(0, numExamples))
                continue
            }

            // Get the filenames of comparison items that are valid examples for this item
            // (that aren't already selected).
            // (defined assertion: loadingAnnotations is true when comparisonItem.annotations.data
            //  is undefined, so will have continued above and not reached here).
            const options = [...comparisonDataset.values()]
                .filter(
                    comparisonItem =>
                        updatedSelections.indexOf(comparisonItem.filename) === -1
                        &&
                        comparison(annotations.data, comparisonItem.annotations.data!)
                )
                .map(item => item.filename)

            // Work out how may more examples we need (should be at least one or we would have
            // already continued above).
            const toPick = numExamples - updatedSelections.length

            // Use all options available to us if there aren't enough, otherwise pick a
            // random subset
            const selectedAdditionalExamples = toPick >= options.length
                ? options
                : randomSubset(options, BigInt(toPick))

            // Add the additional examples to the overall set
            updatedSelections.push(...selectedAdditionalExamples)

            // Finalise the examples for this item
            nextState.set(filename, updatedSelections)
        }

        return nextState
    }

}