import React, {cloneElement, Dispatch, PropsWithChildren, ReactNode} from "react";
import RenderSelectedChildren from "../../util/react/component/RenderSelectedChildren";
import Page from "./Page";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {isArray} from "../../util/typescript/arrays/isArray";
import {nodeIsElement} from "../../util/react/node/nodeIsElement";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import "./MenuPage.css";
import {FunctionComponentReturnType} from "../../util/react/types";

const MENU_PAGE_TITLE = "Menu Page";

export type MenuPageProps = {
    titleGenerator: ((node: ReactNode) => string) | string[]
}

export default function MenuPage(
    props: PropsWithChildren<MenuPageProps>
): FunctionComponentReturnType {

    const [selected, setSelected] = useStateSafe(() => 0);
    const onBack = useDerivedState(
        ([setSelected]) => () => setSelected(9), // 9 is The Loop
        [setSelected]
    );

    const menu = <Page className={"MenuPage"} id={MENU_PAGE_TITLE}>
        {
            React.Children.map(
                props.children,
                (child, index) => {
                    const title = isArray(props.titleGenerator) ?
                        props.titleGenerator[index] :
                        props.titleGenerator(child);
                    return <MenuButton
                        title={title}
                        elementIndex={index + 1}
                        setSelected={setSelected}
                    />
                }
            )
        }
    </Page>;

    const childrenWithOnBack = props.children === undefined || props.children === null
        ? []
        : React.Children.map(
            props.children,
            (child) => {
                if (!nodeIsElement(child)) return child;
                return cloneElement(
                    child,
                    {
                        ...child.props,
                        onBack: onBack
                    }
                );
            }
        );

    return <RenderSelectedChildren
        selector={selected}
    >
        {menu}
        {childrenWithOnBack}
    </RenderSelectedChildren>

}

export type MenuButtonProps = {
    title: any
    elementIndex: number
    setSelected: Dispatch<number>
}

export function MenuButton(
    props: MenuButtonProps
): FunctionComponentReturnType {
    if (typeof props.title !== "string") return null;

    return <button
        className={"ChangePageButton"}
        onClick={() => props.setSelected(props.elementIndex)}
    >
        {props.title}
    </button>
}