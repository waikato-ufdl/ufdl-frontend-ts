import React from "react";
import {list} from "ufdl-ts-client/functional/core/licence";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";
import {LicenceInstance} from "ufdl-ts-client/types/core/licence";

export type LicenceSelectProps = Omit<ListSelectProps<LicenceInstance>, 'list' | 'labelFunction'>

export function LicenceSelect(props: LicenceSelectProps) {
    return <ListSelect<LicenceInstance>
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
