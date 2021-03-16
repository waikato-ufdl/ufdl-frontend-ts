import {constantInitialiser} from "../../typescript/initialisers";
import useNonUpdatingState from "./useNonUpdatingState";

export default function useRenderNotify<D extends {[name: string]: any}>(
    name: string,
    dependencies: D
): void {

    const [last, setLast] = useNonUpdatingState(constantInitialiser(dependencies));

    let anyChanges: boolean = false;

    for (const key in dependencies) {
        if (!dependencies.hasOwnProperty(key)) continue;

        if (last[key] !== dependencies[key]) {
            if (!anyChanges) console.log(`Changes in dependencies for ${name}:`);
            console.log(`${key} (from, to):`);
            console.log(last[key]);
            console.log(dependencies[key]);
            anyChanges = true;
        }
    }

    setLast(dependencies);
}