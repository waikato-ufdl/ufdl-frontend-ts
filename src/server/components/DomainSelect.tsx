import React from "react";
import {DomainName} from "../domains";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {isPresent, Possible} from "../../util/typescript/types/Possible";
import {MapSelect, MapSelectProps} from "../../util/react/component/MapSelect";
import {Controllable} from "../../util/react/hooks/useControllableState";
import {mapFromArray} from "../../util/map";

export type DomainSelectProps<D extends DomainName>
    = Omit<MapSelectProps<D>, 'values' | 'value' | 'onChange'>
    &
    {
        values: readonly D[],
        value: Controllable<D | undefined>
        onChange?: (domain?: D) => void
    }

export function DomainSelect<D extends DomainName>(
    props: DomainSelectProps<D>
) {
    const {
        values,
        value,
        onChange,
        ...mapSelectProps
    } = props;

    const valuesActual = useDerivedState(
        () => mapFromArray(values, (value) => [value, value]),
        [values]
    );

    const onChangeActual = useDerivedState(
        () => {
            return onChange === undefined
                ? undefined
                : (domain: Possible<D>) => onChange(isPresent(domain) ? domain : undefined)
        },
        [onChange]
    );

    return <MapSelect<D>
        values={valuesActual}
        value={value}
        onChange={onChangeActual}
        {...mapSelectProps}
    />;
}

