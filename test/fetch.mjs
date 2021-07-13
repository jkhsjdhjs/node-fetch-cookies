import express from "express";
import cookieParser from "cookie-parser";

import {fetch, Cookie, CookieJar, Headers} from "../src/index.mjs";

export default Test => [
    new Test("fetch(): store cookies on redirects", () => {
        const cookieJar = new CookieJar();
        const app = express();
        app.use(cookieParser());
        app.get("/", (request, response) => {
            response.cookie("foo", "bar", {
                path: "/foo"
            });
            response.redirect("/foo");
        });
        app.get("/foo", (request, response) => {
            if (request.cookies.foo !== "bar") response.status(400);
            response.send();
        });
        return new Promise(resolve => {
            const server = app.listen(8080, async () => {
                try {
                    const response = await fetch(
                        cookieJar,
                        "http://localhost:8080/"
                    );
                    if (response.status !== 200) resolve(false);
                } catch {
                    resolve(false);
                }
                server.close();
                resolve(true);
            });
        });
    }),
    new Test("fetch(): options object stays unmodified", () => {
        const app = express();
        app.use(cookieParser());
        app.get("/", (request, response) => {
            if (request.cookies.foo === "bar") response.redirect("/foo");
            response.status(400).send();
        });
        app.get("/foo", (request, response) => {
            response.send();
        });
        return new Promise(resolve => {
            const server = app.listen(8082, async () => {
                async function checkOptionsModification(options) {
                    const cookieJar = new CookieJar();
                    cookieJar.addCookie(
                        Cookie.fromObject({
                            name: "foo",
                            value: "bar",
                            expiry: null,
                            domain: "localhost",
                            path: "/",
                            secure: false,
                            subdomains: false
                        })
                    );
                    const optionsStr = JSON.stringify(options);
                    const response = await fetch(
                        cookieJar,
                        "http://localhost:8082/",
                        options
                    );
                    if (response.status !== 200) return false;
                    return optionsStr === JSON.stringify(options);
                }
                const options = {
                    method: "GET",
                    headers: {
                        Connection: "close",
                        "User-Agent": "test123"
                    },
                    redirect: "follow",
                    follow: 1
                };
                if (!(await checkOptionsModification(options))) resolve(false);

                options.headers = new Headers(options.headers);
                if (!(await checkOptionsModification(options))) resolve(false);

                delete options.follow;
                if (!(await checkOptionsModification(options))) resolve(false);

                server.close();
                resolve(true);
            });
        });
    })
];
