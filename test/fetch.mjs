import express from "express";
import cookieParser from "cookie-parser";

import {fetch, Cookie, CookieJar, FetchError, Headers} from "../src/index.mjs";

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
    new Test("fetch(): options.follow TypeError", async () => {
        async function expectFollowTypeError(follow) {
            try {
                await fetch(null, "test", {
                    follow: follow
                });
            } catch (error) {
                if (
                    error instanceof TypeError &&
                    error.message ===
                        "options.follow is not a safe positive integer"
                )
                    return true;
            }
            return false;
        }

        for (const follow of [
            null,
            -1,
            "string",
            Number.MAX_SAFE_INTEGER + 1
        ]) {
            if (!(await expectFollowTypeError(follow))) return false;
        }

        for (const follow of [undefined, 0, 10, Number.MAX_SAFE_INTEGER]) {
            if (await expectFollowTypeError(follow)) return false;
        }

        return true;
    }),
    new Test("fetch(): redirect limit", () => {
        const maxRedirects = 10;
        const app = express();
        let redirectCounter = 0;
        app.get("/", (request, response) => {
            if (redirectCounter++ <= maxRedirects) response.redirect("/");
            response.send();
        });
        return new Promise(resolve => {
            const server = app.listen(8081, async () => {
                try {
                    await fetch(null, "http://localhost:8081/", {
                        follow: maxRedirects
                    });
                } catch (error) {
                    if (
                        error instanceof FetchError &&
                        error.type === "max-redirect" &&
                        error.message ===
                            "maximum redirect reached at: http://localhost:8081/"
                    )
                        // we will fetch the final redirect, but not follow it. thus the redirectCounter is maxRedirects + 1
                        resolve(redirectCounter === maxRedirects + 1);
                } finally {
                    server.close();
                    resolve(false);
                }
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
    }),
    new Test('fetch(): options.redirect: "manual"', () => {
        const app = express();
        let redirectCounter = 0;
        app.get("/", (request, response) => {
            if (redirectCounter++ > 0) response.status(400).send();
            response.redirect("/");
        });
        return new Promise(resolve => {
            const server = app.listen(8083, async () => {
                const response = await fetch(null, "http://localhost:8083/", {
                    redirect: "manual"
                });
                if (response.status !== 302) resolve(false);
                server.close();
                resolve(true);
            });
        });
    })
];
