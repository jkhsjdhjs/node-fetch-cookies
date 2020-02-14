import _fetch from "node-fetch";
import CookieJar from "./cookie-jar.mjs";
import Cookie from "./cookie.mjs";
import {paramError, CookieParseError} from "./errors.mjs"

async function fetch(cookieJars, url, options) {
    let cookies = "";
    const addValidFromJars = jars => {
        // since multiple cookie jars can be passed, filter duplicates by using a set of cookie names
        const set = new Set();
        jars.flatMap(jar => [...jar.cookiesValidForRequest(url)])
            .forEach(cookie => {
                if(set.has(cookie.name))
                    return;
                set.add(cookie.name);
                cookies += cookie.serialize() + "; ";
            });
    };
    if(cookieJars) {
        if(Array.isArray(cookieJars) && cookieJars.every(c => c instanceof CookieJar))
            addValidFromJars(cookieJars.filter(jar => jar.flags.includes("r")));
        else if(cookieJars instanceof CookieJar)
            if(cookieJars.flags.includes("r"))
                addValidFromJars([cookieJars]);
        else
            throw paramError("First", "cookieJars", "fetch", ["CookieJar", "[CookieJar]"]);
    }
    if(cookies) {
        if(!options)
            options = {};
        if(!options.headers)
            options.headers = {};
        options.headers.cookie = cookies.slice(0, -2);
    }
    const result = await _fetch(url, options);
    // I cannot use headers.get() here because it joins the cookies to a string
    cookies = result.headers[Object.getOwnPropertySymbols(result.headers)[0]]["set-cookie"];
    if(cookies && cookieJars) {
        if(Array.isArray(cookieJars)) {
            cookieJars
                .filter(jar => jar.flags.includes("w"))
                .forEach(jar => cookies.forEach(c => jar.addCookie(c, url)));
        }
        else if(cookieJars instanceof CookieJar && cookieJars.flags.includes("w"))
            cookies.forEach(c => cookieJars.addCookie(c, url));
    }
    return result;
}

export {fetch, CookieJar, Cookie, CookieParseError};
