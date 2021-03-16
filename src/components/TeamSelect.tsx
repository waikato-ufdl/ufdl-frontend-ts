import React from "react";
import {list} from "ufdl-js-client/functional/core/team";
import {ListSelect, ListSelectProps} from "./ListSelect";
import {nameFromJSON} from "../server/util/nameFromJSON";

export type TeamSelectProps = Omit<ListSelectProps, 'list' | 'labelFunction'>

export function TeamSelect(props: TeamSelectProps) {
    return <ListSelect
        list={list}
        labelFunction={nameFromJSON}
        {...props}
    />
}
