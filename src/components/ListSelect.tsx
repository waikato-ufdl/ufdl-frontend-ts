import React, {useContext, useEffect} from "react";
import {RawJSONObjectSelect} from "./RawJSONObjectSelect";
import {FilterSpec} from "ufdl-js-client/json/generated/FilterSpec";
import {RawJSONObject} from "ufdl-js-client/types";
import {UFDL_SERVER_REACT_CONTEXT} from "../server/UFDLServerContextProvider";
import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import useStateSafe from "../util/react/hooks/useStateSafe";

export type ListSelectProps = {
    list: (context: UFDLServerContext, filter?: FilterSpec) => Promise<RawJSONObject[]>
    filter?: FilterSpec
    labelFunction: (json: RawJSONObject) => string
    forceEmpty?: boolean
    value?: number
    onChange?: (item?: RawJSONObject, pk?: number) => void
    disabled?: boolean
}

export function ListSelect(props: ListSelectProps) {
    const context = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [items, setItems] = useStateSafe<RawJSONObject[]>(() => []);

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
