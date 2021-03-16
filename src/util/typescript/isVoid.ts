export default function isVoid(value: any): value is void {
    return value === undefined || value === null;
}
