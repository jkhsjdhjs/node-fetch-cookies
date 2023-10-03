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
            const server = app.listen(0, async () => {
                try {
                    const response = await fetch(
                        cookieJar,
                        `http://localhost:${server.address().port}/`
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
            const server = app.listen(0, async () => {
                try {
                    await fetch(
                        null,
                        `http://localhost:${server.address().port}/`,
                        {
                            follow: maxRedirects
                        }
                    );
                } catch (error) {
                    if (
                        error instanceof FetchError &&
                        error.type === "max-redirect" &&
                        error.message ===
                            `maximum redirect reached at: http://localhost:${
                                server.address().port
                            }/`
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
            const server = app.listen(0, async () => {
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
                        `http://localhost:${server.address().port}/`,
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
            const server = app.listen(0, async () => {
                const response = await fetch(
                    null,
                    `http://localhost:${server.address().port}/`,
                    {
                        redirect: "manual"
                    }
                );
                if (response.status !== 302) resolve(false);
                server.close();
                resolve(true);
            });
        });
    }),
    new Test("fetch(): options.headers are sent correctly", () => {
        const app = express();
        app.get("/", (request, response) => {
            for (const [key, value] of Object.entries(request.headers)) {
                if (key.startsWith("x-")) response.set(key, value);
            }
            response.send();
        });
        // test whether options.headers are correctly sent as object (dict) and also as Headers() object
        return new Promise(resolve => {
            const server = app.listen(0, async () => {
                const HEADER_ASSERT = {
                    "X-abc": "def",
                    "X-foo": "bar"
                };
                for (const headers of [
                    HEADER_ASSERT,
                    new Headers(HEADER_ASSERT)
                ]) {
                    const response = await fetch(
                        null,
                        `http://localhost:${server.address().port}/`,
                        {headers: headers}
                    );
                    for (const [key, value] of Object.entries(HEADER_ASSERT)) {
                        if (response.headers.get(key) !== value) resolve(false);
                    }
                }
                server.close();
                resolve(true);
            });
        });
    }),
    new Test("fetch(): HTTP 301/302/303 method change", () => {
        const app = express();
        let redirectCounter = 0;
        app.all("/:statusCode(\\d+)", (request, response) => {
            redirectCounter++;
            response.redirect(+request.params.statusCode, "/get");
        });
        app.get("/get", (request, response) => {
            response.set("X-foo", "bar");
            response.send();
        });
        app.all("/get", (request, response) => {
            response.send();
        });
        return new Promise(resolve => {
            const server = app.listen(0, async () => {
                async function testRequestMethodChange(
                    method,
                    statusCode,
                    shouldGET
                ) {
                    redirectCounter = 0;
                    const response = await fetch(
                        null,
                        `http://localhost:${server.address().port}/` +
                            String(statusCode),
                        {method: method}
                    );
                    if (
                        response.status !== 200 ||
                        redirectCounter !== 1 ||
                        shouldGET !== (response.headers.get("X-foo") === "bar")
                    )
                        resolve(false);
                }
                for (const [method, shouldGET] of [
                    ["GET", true],
                    ["POST", true],
                    ["PUT", false],
                    ["DELETE", false],
                    ["OPTIONS", false],
                    ["HEAD", true]
                ]) {
                    // test whether 301/302 with POST changes method to GET...
                    for (const statusCode of [301, 302]) {
                        await testRequestMethodChange(
                            method,
                            statusCode,
                            shouldGET
                        );
                    }
                    // ...and the same for 303 with any method
                    await testRequestMethodChange(method, 303, true);
                }
                server.close();
                resolve(true);
            });
        });
    }),
    new Test("fetch(): no duplicate header on redirect", () => {
        const app = express();
        app.use(cookieParser());
        app.put("/", (request, response) => {
            response.cookie("foo", "bar");
            response.redirect(302, "/redirect");
        });
        app.put("/redirect", (request, response) => {
            response.cookie("foo2", "bar");
            response.redirect(303, "/redirect2");
        });
        app.get("/redirect2", (request, response) => {
            if (request.headers["cookie"].split("foo=bar").length > 2) {
                response.status(400);
            }
            response.send();
        });
        return new Promise(resolve => {
            const server = app.listen(0, async () => {
                const cookieJar = new CookieJar();
                const response = await fetch(cookieJar, `http://localhost:${server.address().port}/`, {
                    method: "PUT"
                });
                server.close();
                resolve(response.ok);
            });

        });
    })
];
