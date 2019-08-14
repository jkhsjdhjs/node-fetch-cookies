import fetch from "node-fetch";
import CookieJar from "./cookie-jar";
import Cookie from "./cookie";

async function cookieFetch(cookieJars, url, options) {
    let cookies = "";
    const addValidFromJars = jars =>
        jars
            .map(jar => [...jar.cookiesValidForRequest(url)])
            .reduce((a, b) => [...a, ...b])
            .filter((v, i, a) => a.slice(0, i).every(c => c.name !== v.name)) // filter cookies with duplicate names
            .forEach(c => cookies += c.serialize() + "; ");
    if(cookieJars) {
        if(Array.isArray(cookieJars) && cookieJars.every(c => c instanceof CookieJar))
            addValidFromJars(cookieJars.filter(jar => jar.flags.includes("r")));
        else if(cookieJars instanceof CookieJar && cookieJars.flags.includes("r"))
            addValidFromJars([cookieJars]);
        else
            throw new TypeError("First paramter is neither a cookie jar nor an array of cookie jars!");
    }
    if(cookies) {
        if(!options)
            options = {};
        if(!options.headers)
            options.headers = {};
        options.headers.cookie = cookies.slice(0, -2);
    }
    const result = await fetch(url, options);
    // i cannot use headers.get() here because it joins the cookies to a string
    cookies = result.headers[Object.getOwnPropertySymbols(result.headers)[0]]["set-cookie"];
    if(cookies && cookieJars) {
        if(Array.isArray(cookieJars)) {
            cookieJars
                .filter(jar => jar.flags.includes("w"))
                .forEach(jar => cookies.forEach(c => jar.addCookie(c, url)));
        }
        else if(cookieJars instanceof CookieJar && cookieJars.flags.includes("w")) {
            cookies.forEach(c => cookieJars.addCookie(c, url));
        }
    }
    return result;
}

export {cookieFetch as fetch, CookieJar, Cookie};
