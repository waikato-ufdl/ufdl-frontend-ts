import React, {JSXElementConstructor, ReactElement} from "react";
import {JSXFunctionElementConstructor} from "./jsx/JSXFunctionElementConstructor";
import {JSXClassElementConstructor, jsxElementConstructorIsClass} from "./jsx/JSXClassElementConstructor";
import {multiMemo} from "../memo";

/**
 * The type of props with the hide-prop included.
 */
export type WithHideProp<P> = P & { hide?: boolean }

/**
 * Higher-order component which creates a hideable version of
 * the given component. The component is still rendered so that
 * any effects still occur, but is only displayed if selected to
 * do so.
 *
 * @param component
 *          The component to create a hideable version of.
 * @return
 *          The hideable version of the component.
 */
function createHideableComponent<P>(
    component: JSXElementConstructor<P>
): JSXElementConstructor<WithHideProp<P>> {
    if (jsxElementConstructorIsClass(component)) {
        return class extends component {
            render() {
                const rendered = super.render();
                return (this.props as WithHideProp<P>).hide === true ? null : rendered;
            }
        }
    } else {
        return (props: WithHideProp<P>) => {
            const rendered = component(props);
            return props.hide === true ? null : rendered;
        };
    }
}

/**
 * Ensures that a new hideable version of a component isn't created on each
 * call, instead caching previous hideable versions.
 */
const createHideableComponentMemoised = multiMemo(createHideableComponent);

export default function hideable<P>(component: JSXFunctionElementConstructor<P>): JSXFunctionElementConstructor<WithHideProp<P>>;
export default function hideable<P>(component: JSXClassElementConstructor<P>): JSXClassElementConstructor<WithHideProp<P>>;
export default function hideable<P>(component: JSXElementConstructor<P>): JSXElementConstructor<WithHideProp<P>>;
export default function hideable<P>(
    component: JSXElementConstructor<P>
): JSXElementConstructor<WithHideProp<P>> {
    return createHideableComponentMemoised(component);
}

/**
 * Clones an element and makes it hideable, and possibly hidden,
 * at the same time.
 *
 * @param element
 *          The element to clone.
 * @param hide
 *          Whether to hide the resulting element.
 */
export function cloneElementAsHideable<P extends object>(
    element: ReactElement<P, JSXElementConstructor<P>>,
    hide: boolean
): ReactElement<P, JSXElementConstructor<P>> {
    // Clone the element, adding the HIDE flag
    const clonedElement = React.cloneElement(
        element,
        {
            hide: hide
        } as Partial<WithHideProp<P>>
    ) as ReactElement<WithHideProp<P>, JSXElementConstructor<WithHideProp<P>>>;

    // Exchange the type for the hideable equivalent
    clonedElement.type = hideable(clonedElement.type);

    return clonedElement;
}
