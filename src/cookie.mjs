import url from "url";
import {paramError, CookieParseError} from "./errors.mjs";

const validateHostname = (cookieHostname, requestHostname, subdomains) => {
    cookieHostname = cookieHostname.toLowerCase();
    requestHostname = requestHostname.toLowerCase();
    if(requestHostname === cookieHostname || (subdomains && requestHostname.endsWith("." + cookieHostname)))
        return true;
    return false;
};

const validatePath = (cookiePath, requestPath) => {
    cookiePath = decodeURIComponent(cookiePath).toLowerCase();
    requestPath = decodeURIComponent(requestPath).toLowerCase();
    if(cookiePath.endsWith("/"))
        cookiePath = cookiePath.slice(0, -1);
    if(requestPath.endsWith("/"))
        requestPath = requestPath.slice(0, -1);
    return (requestPath + "/").startsWith(cookiePath + "/");
};

const splitN = (str, sep, n) => {
    const splitted = str.split(sep);
    if(n < splitted.length - 1) {
        splitted[n] = splitted.slice(n).join(sep);
        splitted.splice(n + 1);
    }
    return splitted;
};

export default class Cookie {
    constructor(str, requestURL) {
        if(typeof str !== "string")
            throw paramError("First", "str", "new Cookie()", "string");
        if(typeof requestURL !== "string")
            throw paramError("Second", "requestURL", "new Cookie()", "string");

        // check if url is valid
        new url.URL(requestURL);

        const splitted = str.split("; ");
        [this.name, this.value] = splitN(splitted[0], "=", 1);
        if(!this.name)
            throw new CookieParseError("Invalid cookie name \"" + this.name + "\"!");
        if(this.value.startsWith("\"") && this.value.endsWith("\""))
            this.value = this.value.slice(1, -1);

        const parsedURL = url.parse(requestURL);

        for(let i = 1; i < splitted.length; i++) {
            let [k, v] = splitN(splitted[i], "=", 1);
            k = k.toLowerCase();
            if(v) {
                if(k === "expires") {
                    if(this.expiry) // max-age has precedence over expires
                        continue;
                    if(!/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2}[ -](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[ -]\d{2,4} \d{2}:\d{2}:\d{2} GMT$/.test(v)
                        || (this.expiry = new Date(v)).toString() === "Invalid Date"
                        || this.expiry.getTime() < 0)
                        throw new CookieParseError("Invalid value for Expires \"" + v + "\"!");
                }
                else if(k === "max-age") {
                    const seconds = ~~+v;
                    if(seconds.toString() !== v)
                        throw new CookieParseError("Invalid value for Max-Age \"" + v + "\"!");
                    this.expiry = new Date();
                    this.expiry.setSeconds(this.expiry.getSeconds() + seconds);
                }
                else if(k === "domain") {
                    if(v.startsWith("."))
                        v = v.substring(1);
                    if(!validateHostname(parsedURL.hostname, v, true))
                        throw new CookieParseError("Invalid value for Domain \"" + v + "\": cookie was received from \"" + parsedURL.hostname + "\"!");
                    this.domain = v;
                    this.subdomains = true;
                }
                else if(k === "path")
                    this.path = v;
                else if(k === "samesite") // only relevant for cross site requests, so not for us
                    continue;
                else
                    throw new CookieParseError("Invalid key \"" + k + "\" with value \"" + v + "\" specified!");
            }
            else {
                if(k === "secure")
                    this.secure = true;
                else if(k === "httponly") // only relevant for browsers
                    continue;
                else
                    throw new CookieParseError("Invalid key \"" + k + "\" specified!");
            }
        }

        if(this.name.toLowerCase().startsWith("__secure-") && (!this.secure || parsedURL.protocol !== "https:"))
            throw new CookieParseError("Cookie has \"__Secure-\" prefix but \"Secure\" isn't set or the cookie is not set via https!");
        if(this.name.toLowerCase().startsWith("__host-") && (!this.secure || parsedURL.protocol !== "https:" || this.domain || this.path !== "/"))
            throw new CookieParseError("Cookie has \"__Host-\" prefix but \"Secure\" isn't set, the cookie is not set via https, \"Domain\" is set or \"Path\" is not equal to \"/\"!");

        // assign defaults
        if(!this.domain) {
            this.domain = parsedURL.hostname;
            this.subdomains = false;
        }
        if(!this.path)
            this.path = "/";
        if(!this.secure)
            this.secure = false;
        if(!this.expiry)
            this.expiry = null;
    }
    static fromObject(obj) {
        let c = Object.assign(Object.create(this.prototype), obj);
        if(typeof c.expiry === "string")
            c.expiry = new Date(c.expiry);
        return c;
    }
    serialize() {
        return this.name + "=" + this.value;
    }
    hasExpired(sessionEnded) {
        return sessionEnded && this.expiry === null || this.expiry && this.expiry < new Date();
    }
    isValidForRequest(requestURL) {
        if(this.hasExpired(false))
            return false;
        const parsedURL = url.parse(requestURL);
        if(parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:"
        || this.secure && parsedURL.protocol !== "https:"
        || !validateHostname(this.domain, parsedURL.hostname, this.subdomains)
        || !validatePath(this.path, parsedURL.pathname))
            return false;
        return true;
    }
};
