import React from "react";
import {list} from "ufdl-ts-client/functional/core/licence";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";
import useRenderNotify from "../util/react/hooks/useRenderNotify";
import useNonUpdatingState from "../util/react/hooks/useNonUpdatingState";

export type LicenceSelectProps = Omit<ListSelectProps, 'list' | 'labelFunction'>

export function LicenceSelect(props: LicenceSelectProps) {
    return <ListSelect
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
