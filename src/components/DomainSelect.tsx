import React, {SelectHTMLAttributes} from "react";
import {AvailableDomainsType, DOMAIN_NAMES} from "../server/domains";
import asChangeEventHandler from "../util/react/asChangeEventHandler";

export type DomainSelectProps<D extends AvailableDomainsType> = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
    onChange?: (domain?: D) => void,
    domains: readonly D[]
}

export function DomainSelect<D extends AvailableDomainsType>(props: DomainSelectProps<D>) {
    const {onChange, domains, ...selectProps} = props;

    const selectOnChange = asChangeEventHandler(
        onChange,
        (eventValue) => eventValue === "" ? undefined : eventValue as unknown as D
    );

    return <select onChange={selectOnChange} {...selectProps}>
        <option key={""} value={""}>{""}</option>
        {options(domains)}
    </select>
}

function options<D extends AvailableDomainsType>(domains: readonly D[]) {
    return domains.map(
        (code) => <option key={code} value={code}>{DOMAIN_NAMES[code]}</option>
    )
}

