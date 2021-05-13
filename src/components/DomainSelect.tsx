import React from "react";
import {Domain, DOMAIN_NAMES} from "../server/domains";
import useDerivedState from "../util/react/hooks/useDerivedState";
import {isPresent, Possible} from "../util/typescript/types/Possible";
import {MapSelect, MapSelectProps} from "../util/react/component/MapSelect";
import {Controllable, isControlled} from "../util/react/hooks/useControllableState";
import {mapFromArray} from "../util/map";

export type DomainSelectProps<D extends Domain>
    = Omit<MapSelectProps<D>, 'values' | 'value' | 'onChange'>
    &
    {
        values: readonly D[],
        value: Controllable<D | undefined>
        onChange?: (domain?: D) => void
    }

export function DomainSelect<D extends Domain>(
    props: DomainSelectProps<D>
) {
    const {
        values,
        value,
        onChange,
        ...mapSelectProps
    } = props;

    const valuesActual = useDerivedState(
        () => mapFromArray(values, (value) => [DOMAIN_NAMES[value], value]),
        [values]
    );

    const valueActual = useDerivedState(
        () => !isControlled(value) || value === undefined ? value : DOMAIN_NAMES[value],
        [value]
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
        value={valueActual}
        onChange={onChangeActual}
        {...mapSelectProps}
    />;
}

