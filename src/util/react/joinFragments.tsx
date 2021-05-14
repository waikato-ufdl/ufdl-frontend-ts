import {ReactFragment} from "react";
import iteratorConcat from "../typescript/iterate/concat";
import iteratorMap from "../typescript/iterate/map";
import {isArray} from "../typescript/arrays/isArray";
import iterateLiteral from "../typescript/iterate/iterateLiteral";

export default function joinFragments(
    ...fragments: ReactFragment[]
): ReactFragment {
    return <>
        {
            [
                ...iteratorConcat(
                    ...iteratorMap(
                        fragments[Symbol.iterator](),
                        (fragment) => {
                            if (!isArray(fragment)) return iterateLiteral();
                            return fragment[Symbol.iterator]();
                        }
                    )
                )
            ]
        }
    </>
}