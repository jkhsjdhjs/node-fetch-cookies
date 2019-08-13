import fs from "fs";
import Cookie from "./cookie";

export default class CookieJar {
    constructor(flags, file, cookies) {
        this.cookies = new Map();
        this.file = file;
        this.flags = flags;
        if(typeof this.flags !== "string")
            throw new TypeError("First parameter is not a string!");
        if(this.file && typeof this.file !== "string")
            throw new TypeError("Second parameter is not a string!");
        if(this.file && fs.existsSync(this.file))
            this.addFromFile(this.file);
        else
            this.cookies = new Map();
        if(Array.isArray(cookies)) {
            if(!cookies.every(c => c instanceof Cookie))
                throw new TypeError("Third parameter is not an array of cookies!");
            else
                cookies.forEach(cookie => this.addCookie(cookie));
        }
        else if(cookies instanceof Cookie)
            this.addCookie(cookies);
        else if(cookies)
            throw new TypeError("Third parameter is neither an array nor a cookie!");
    }
    addCookie(c, fromURL) {
        if(typeof c === "string")
            c = new Cookie(c, fromURL);
        if(!(c instanceof Cookie))
            throw new TypeError("First parameter is neither a string nor a cookie!");
        if(!this.cookies.get(c.domain))
            this.cookies.set(c.domain, new Map());
        this.cookies.get(c.domain).set(c.name, c);
    }
    addFromFile(file) {
        JSON.parse(fs.readFileSync(this.file)).forEach(c => this.addCookie(Cookie.fromObject(c)));
    }
    domains() {
        return [...this.cookies.keys()];
    }
    *iterValidForRequest(domain, url) {
        for(const cookie of this.iter(domain))
            if(cookie.isValidForRequest(url))
                yield cookie;
    }
    *iterValid() {
        for(const cookie of this.iterAll())
            if(!cookie.hasExpired())
                yield cookie;
    }
    *iterAll() {
        for(const domain of this.domains())
            yield* this.iter(domain);
    }
    *iter(domain) {
        for(const cookie of (this.cookies.get(domain) || []).values())
            yield cookie;
    }
    deleteExpired() {
        const filteredCookies = [...this.iterValid()];
        this.cookies = new Map();
        filteredCookies.forEach(c => this.addCookie(c));
    }
    save() {
        if(typeof this.file !== "string")
            throw new Error("No file has been specified for this cookie jar!");
        // only save cookies that haven't expired
        fs.writeFileSync(this.file, JSON.stringify([...this.iterValid()]));
    }
};
