export class CookieParseError extends Error {
    constructor(...args) {
        super(...args);
        this.name = "CookieParseError";
    }
};

export function paramError(position, paramName, functionName, validTypes) {
    validTypes = [validTypes].flat().map(t => "\"" + t + "\"");
    validTypes = validTypes.slice(0, -1).join(", ") + (validTypes.length > 1 ? " or " : "") + validTypes.slice(-1);
    return new TypeError(`${position} parameter "${paramName}" passed to "${functionName}" is not of type ${validTypes}!`);
};
