import React, {useContext, useEffect} from "react";
import {RawJSONObjectSelect} from "./RawJSONObjectSelect";
import {FilterSpec} from "ufdl-ts-client/json/generated/FilterSpec";
import {RawModelInstance} from "ufdl-ts-client/types/base";
import {UFDL_SERVER_REACT_CONTEXT} from "../server/UFDLServerContextProvider";
import useStateSafe from "../util/react/hooks/useStateSafe";
import {Controllable} from "../util/react/hooks/useControllableState";
import {ListFunction} from "../server/util/types";

export type ListSelectProps<M extends RawModelInstance> = {
    list: ListFunction<M>
    filter?: FilterSpec
    labelFunction: (json: M) => string
    forceEmpty?: boolean
    value: Controllable<number>
    onChange?: (item?: M, pk?: number) => void
    disabled?: boolean
}

export function ListSelect<M extends RawModelInstance>(props: ListSelectProps<M>) {
    const context = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [items, setItems] = useStateSafe<M[]>(() => []);

    const {list, filter, labelFunction, forceEmpty, value, onChange, disabled} = props;

    useEffect(
        () => {
            if (forceEmpty !== true) list(context, filter).then(setItems)
        },
        [context.host, context.username, filter, list]
    );

    return <RawJSONObjectSelect
        values={forceEmpty === true ? [] : items}
        value={forceEmpty === true ? -1 : value}
        labelFunction={labelFunction}
        onChange={onChange}
        disabled={disabled === true || forceEmpty === true}
    />
}
