import {CookieParseError, paramError} from "../src/errors.mjs";

export default Test => [
    new Test("function paramError", () => {
        const position = "something";
        const paramName = "some_param";
        const functionName = "some_func";
        const validTypes = ["lol", "lel", "lul", "lal"];
        const errors = [
            paramError(position, paramName, functionName, validTypes[0]),
            paramError(position, paramName, functionName, validTypes.slice(0, 2)),
            paramError(position, paramName, functionName, validTypes)
        ];
        return errors.every(e => e instanceof TypeError)
            && errors.every(e => e.name === "TypeError")
            && errors[0].message === "something parameter \"some_param\" passed to \"some_func\" is not of type \"lol\"!"
            && errors[1].message === "something parameter \"some_param\" passed to \"some_func\" is not of type \"lol\" or \"lel\"!"
            && errors[2].message === "something parameter \"some_param\" passed to \"some_func\" is not of type \"lol\", \"lel\", \"lul\" or \"lal\"!";
    }),
    new Test("class CookieParseError", () => {
        const message = "this is a test error";
        const error = new CookieParseError(message);
        return error instanceof CookieParseError
            && error.name === "CookieParseError"
            && error.message === message;
    })
];
