import urlParser from "url";

const validateHostname = (cookieHostname, requestHostname, subdomains) => {
    cookieHostname = cookieHostname.toLowerCase();
    requestHostname = requestHostname.toLowerCase();
    if(requestHostname === cookieHostname || (subdomains && requestHostname.endsWith("." + cookieHostname)))
        return true;
    return false;
};

const validatePath = (cookiePath, requestPath) => {
    cookiePath = cookiePath.toLowerCase();
    requestPath = requestPath.toLowerCase();
    if(cookiePath.endsWith("/"))
        cookiePath = cookiePath.slice(0, -1);
    if(requestPath.endsWith("/"))
        requestPath = requestPath.slice(0, -1);
    return (requestPath + "/").startsWith(cookiePath + "/");
};

export default class Cookie {
    constructor(str, url) {
        if(typeof str !== "string")
            throw new TypeError("Input not a string");

        const splitted = str.split("; ");
        [this.name, this.value] = splitted[0].split("=");
        if(this.value.startsWith("\"") && this.value.endsWith("\""))
            this.value = this.value.slice(1, -1);
        this.value = this.value;

        for(let i = 1; i < splitted.length; i++) {
            let [k, v] = splitted[i].split("=");
            k = k.toLowerCase();
            if(v) {
                if(k === "expires") {
                    if(this.expiry) // max-age has precedence over expires
                        continue;
                    if(!/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2}[ -](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[ -]\d{2,4} \d{2}:\d{2}:\d{2} GMT$/.test(v)
                        || (this.expiry = new Date(v)) === "Invalid Date")
                        throw new TypeError("Invalid value for Expires \"" + v + "\"!");
                }
                else if(k === "max-age") {
                    const seconds = parseInt(v);
                    if(seconds.toString() !== v)
                        throw new TypeError("Invalid value for Max-Age \"" + v + "\"!");
                    this.expiry = new Date();
                    this.expiry.setSeconds(this.expiry.getSeconds() + seconds);
                }
                else if(k === "domain") {
                    if(v.startsWith("."))
                        v = v.substring(1);
                    this.domain = v;
                    this.subdomains = true;
                }
                else if(k === "path") {
                    this.path = v;
                }
                else if(k === "samesite") // only relevant for cross site requests, so not for us
                    continue;
                else
                    throw new TypeError("Invalid key \"" + k + "\" specified!");
            }
            else {
                if(k === "secure")
                    this.secure = true;
                else if(k === "httponly") // only relevant for browsers
                    continue;
                else
                    throw new TypeError("Invalid key \"" + k + "\" specified!");
            }
        }
        if(!this.domain) {
            this.domain = urlParser.parse(url).hostname;
            this.subdomains = false;
        }
        if(!this.path)
            this.path = "/";
        if(this.name.toLowerCase().startsWith("__secure-") && (!this.secure || !url.toLowerCase().startsWith("https:")))
            throw new TypeError("Cookie has \"__Secure-\" prefix but \"Secure\" isn't set or the cookie is not set via https!");
        if(this.name.toLowerCase().startsWith("__host-") && (!this.secure || !url.toLowerCase().startsWith("https:") || this.domain || this.path !== "/"))
            throw new TypeError("Cookie has \"__Host-\" prefix but \"Secure\" isn't set, the cookie is not set via https, \"Domain\" is set or \"Path\" is not equal to \"/\"!");
    }
    static fromObject(obj) {
        let c = Object.assign(Object.create(this.prototype), obj);
        if(c.expiry && typeof c.expiry === "string")
            c.expiry = new Date(c.expiry);
        return c;
    }
    serialize() {
        return this.name + "=" + this.value;
    }
    isValidForRequest(url) {
        if(this.expiry && this.expiry < new Date())
            return false;
        const parsedURL = urlParser.parse(url);
        if(parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:")
            return false;
        if(this.secure && parsedURL.protocol !== "https:")
            return false;
        if(!validateHostname(this.domain, parsedURL.hostname, this.subdomains))
            return false;
        if(!validatePath(this.path, parsedURL.pathname))
            return false;
        return true;
    }
};
