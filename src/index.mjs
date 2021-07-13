import nodeFetch, {Headers, Request, Response, FetchError} from "node-fetch";
import CookieJar from "./cookie-jar.mjs";
import Cookie from "./cookie.mjs";
import {paramError, CookieParseError} from "./errors.mjs";

const {isRedirect} = nodeFetch;

async function fetch(cookieJars, url, options) {
    let cookies = "";
    const addValidFromJars = jars => {
        // since multiple cookie jars can be passed, filter duplicates by using a set of cookie names
        const set = new Set();
        jars.flatMap(jar => [...jar.cookiesValidForRequest(url)]).forEach(
            cookie => {
                if (set.has(cookie.name)) return;
                set.add(cookie.name);
                cookies += cookie.serialize() + "; ";
            }
        );
    };
    if (cookieJars) {
        if (
            Array.isArray(cookieJars) &&
            cookieJars.every(c => c instanceof CookieJar)
        )
            addValidFromJars(cookieJars.filter(jar => jar.flags.includes("r")));
        else if (cookieJars instanceof CookieJar)
            if (cookieJars.flags.includes("r")) addValidFromJars([cookieJars]);
            else
                throw paramError("First", "cookieJars", "fetch", [
                    "CookieJar",
                    "[CookieJar]"
                ]);
    }

    const wantFollow =
        !options || !options.redirect || options.redirect === "follow";
    if (!options) {
        if (cookies || wantFollow) options = {};
    }
    // shallow copy so we don't modify the original options object
    else options = {...options};
    if (
        options.follow !== undefined &&
        (!Number.isSafeInteger(options.follow) || options.follow < 0)
    )
        throw new TypeError("options.follow is not a safe positive integer");
    if (cookies) {
        if (options.headers instanceof Headers) {
            // copy Headers as well so we don't modify it
            options.headers = new Headers(options.headers);
            options.headers.append("cookie", cookies.slice(0, -2));
        } else
            options.headers = {
                ...(options.headers || {}),
                ...{cookie: cookies.slice(0, -2)}
            };
    }
    if (wantFollow) options.redirect = "manual";
    const result = await nodeFetch(url, options);
    // I cannot use headers.get() here because it joins the cookies to a string
    cookies = result.headers.raw()["set-cookie"];
    if (cookies && cookieJars) {
        if (Array.isArray(cookieJars)) {
            cookieJars
                .filter(jar => jar.flags.includes("w"))
                .forEach(jar => cookies.forEach(c => jar.addCookie(c, url)));
        } else if (
            cookieJars instanceof CookieJar &&
            cookieJars.flags.includes("w")
        )
            cookies.forEach(c => cookieJars.addCookie(c, url));
    }
    if (wantFollow && isRedirect(result.status)) {
        if (options.follow !== undefined && --options.follow < 0)
            throw new FetchError(
                "maximum redirect reached at: " + url,
                "max-redirect"
            );
        const location = result.headers.get("location");
        options.redirect = "follow";
        return fetch(cookieJars, location, options);
    }
    return result;
}

export default fetch;

export {
    fetch,
    CookieJar,
    Cookie,
    CookieParseError,
    nodeFetch,
    Headers,
    Request,
    Response,
    FetchError,
    isRedirect
};
