import fs from "fs";
import Cookie from "./cookie";

export default class CookieJar {
    constructor(flags, file, cookies) {
        this.cookies = new Map();
        this.file = file;
        this.flags = flags;
        if(typeof this.flags !== "string")
            throw new TypeError("First parameter is not a string!");
        if(typeof this.file !== "string")
            throw new TypeError("Second parameter is not a string!");
        if(Array.isArray(cookies)) {
            if(!cookies.every(c => c instanceof Cookie))
                throw new TypeError("Third parameter is not an array of cookies!");
            else
                cookies.forEach(cookie => this.cookies.set(cookie.name, cookie));
        }
        else if(cookies instanceof Cookie)
            this.cookies.set(cookies.name, cookies);
        else if(cookies)
            throw new TypeError("Third parameter is neither an array nor a cookie!");
        if(this.cookies.size === 0 && this.file.length !== 0 && fs.existsSync(this.file))
            this.cookies = new Map(JSON.parse(fs.readFileSync(this.file)).map(([k, v]) => [k, Cookie.fromObject(v)]));
    }
    addCookie(c, fromURL) {
        if(typeof c === "string")
            c = new Cookie(c, fromURL);
        this.cookies.set(c.name, c);
    }
    forEach(callback) {
        this.cookies.forEach(callback);
    }
    save() {
        // only save cookies that haven't expired
        let cookiesToSave = new Map();
        this.forEach(cookie => {
            if(!cookie.hasExpired())
                cookiesToSave.set(cookie.name, cookie);
        });
        fs.writeFileSync(this.file, JSON.stringify([...cookiesToSave]));
    }
};
