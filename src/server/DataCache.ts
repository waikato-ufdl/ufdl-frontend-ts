import {mapGetDefault} from "../util/map";
import behaviourSubjectOperatorFunction from "../util/rx/behaviourSubjectOperatorFunction";
import {map} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";

type InTransit<D> = D | BehaviorSubject<D>

export class DataCache<D> extends Map<string, InTransit<Blob>> {
    private readonly _convertedMap: Map<string, InTransit<D>>;
    private readonly _convert: (blob: Blob) => D

    constructor(
        convert: (blob: Blob) => D
    ) {
        super();
        this._convertedMap = new Map();
        this._convert = convert;
    }

    clear(): void {
        super.clear();
        this._convertedMap.clear();
    }

    delete(key: string): boolean {
        this._convertedMap.delete(key);
        return super.delete(key);
    }

    getConverted(key: string): InTransit<D> | undefined {
        return mapGetDefault(
            this._convertedMap,
            key,
            () => {
                const data = this.get(key);

                if (data === undefined)
                    return undefined;
                else if (data instanceof Blob)
                    return this._convert(data);
                else
                    return behaviourSubjectOperatorFunction(map(this._convert))(data);
            },
            this.has(key)
        );
    }
}
