export default function getRootElement(): HTMLElement {
    const root = document.getElementById('root');

    if (root === null) throw new Error("No root element found!");

    return root;
}
