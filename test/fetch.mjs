import express from "express";
import cookieParser from "cookie-parser";

import {fetch, CookieJar} from "../src/index.mjs";

export default Test => [
    new Test("fetch()", () => {
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
            if (request.cookies.foo !== "bar") response.status(400).send();
            response.send();
        });
        return new Promise(resolve => {
            const server = app.listen(8080, async () => {
                try {
                    const response = await fetch(
                        cookieJar,
                        "http://localhost:8080"
                    );
                    if (response.status !== 200) resolve(false);
                } catch {
                    resolve(false);
                }
                server.close();
                resolve(true);
            });
        });
    })
];
