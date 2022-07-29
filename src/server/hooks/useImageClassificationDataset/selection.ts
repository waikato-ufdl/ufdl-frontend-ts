import {Dataset} from "../../types/Dataset";
import {SELECTIONS} from "../useDataset/selection";
import {Classification, NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
import randomSubset from "../../../util/typescript/random/randomSubset";
import {DatasetDispatchItem} from "../useDataset/DatasetDispatch";
import hasData from "../../../util/react/query/hasData";
import {Data} from "../../types/data";
import isDefined from "../../../util/typescript/isDefined";
import {DatasetItem} from "../../types/DatasetItem";
import {mapGetDefault} from "../../../util/map";
import iteratorFilter from "../../../util/typescript/iterate/filter";
import iteratorMap from "../../../util/typescript/iterate/map";
import {DatasetDispatchItemSelector} from "../useDataset/types";

export const IC_SELECTIONS = {
    ...SELECTIONS,
    withClassification(
        classification: OptionalAnnotations<Classification>
    ): DatasetDispatchItemSelector<Data, Classification> {
        return (item) => {
            const annotations = item.annotations
            if (hasData(annotations)) {
                const data = annotations.data
                return data === classification;
            }
            return false;
        }
    },
    correctForEval<A>(
        evalDataset: Dataset<DatasetItem<unknown, A>>,
        extractClassification: (annotation: A) => Classification | undefined
    ): DatasetDispatchItemSelector<Data, Classification> {
        return this.forEval(
            evalDataset,
            (item, evalItem) => {
                if (!isDefined(evalItem)) return false

                const evalClassification = extractClassification(evalItem.annotations)

                if (!isDefined(evalClassification)) return false

                const annotationsResult = item.annotations

                if (!hasData(annotationsResult)) return false

                const annotations = annotationsResult.data

                return annotations === evalClassification
            }
        )
    },
    incorrectForEval<A>(
        evalDataset: Dataset<DatasetItem<unknown, A>>,
        extractClassification: (annotation: A) => Classification | undefined
    ): DatasetDispatchItemSelector<Data, Classification> {
        return this.forEval(
            evalDataset,
            (item, evalItem) => {
                if (!isDefined(evalItem)) return false

                const evalClassification = extractClassification(evalItem.annotations)

                if (!isDefined(evalClassification)) return false

                const annotationsResult = item.annotations

                if (!hasData(annotationsResult)) return false

                const annotations = annotationsResult.data

                return annotations !== evalClassification
            }
        )
    },
    chooseRandomMFromEachClass(
        m: number,
        seed?: string
    ): DatasetDispatchItemSelector<Data, Classification> {
        let selectorSets: Map<string, Set<string>> | undefined = undefined

        function lazySelected(
            dataset: Dataset<DatasetDispatchItem<Data, Classification>>,
            class_: string,
            filename: string
        ): boolean {
            if (!isDefined(selectorSets)) selectorSets = new Map()

            const classSet = mapGetDefault(
                selectorSets,
                class_,
                () => {
                    const entriesForClass = iteratorFilter(
                        dataset.entries(),
                        ([_, item]) => {
                            const annotationsResult = item.annotations

                            if (!hasData(annotationsResult)) return false

                            const annotations = annotationsResult.data

                            if (annotations === NO_ANNOTATION) return false

                            return annotations === class_
                        }
                    )

                    const filenamesForClass = iteratorMap(
                        entriesForClass,
                        ([filename]) => filename
                    )

                    return new Set(
                        randomSubset(
                            [...filenamesForClass],
                            BigInt(m),
                            false,
                            false,
                            seed
                        )
                    )
                },
                true
            )

            return classSet.has(filename)
        }

        return (item, filename, dataset) => {
            const annotationsResult = item.annotations

            if (!hasData(annotationsResult)) return false

            const annotations = annotationsResult.data

            if (annotations === NO_ANNOTATION) return false

            return lazySelected(dataset, annotations, filename)
        }
    }
} as const;