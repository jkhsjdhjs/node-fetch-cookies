import CookieJar from "../src/cookie-jar.mjs";
import Cookie from "../src/cookie.mjs";

export default Test => [
    new Test(
        "new CookieJar() / save() / load() / deleteExpired() / generator functions",
        async () => {
            const cookies = [
                new Cookie("foo=bar", "https://foo.bar"),
                new Cookie("foo=bar", "https://bar.foo"),
                new Cookie("test=lol; Max-Age=100; Secure", "https://localhost")
            ];
            let cookieJar = new CookieJar("test.json", "rw", cookies);
            if (
                [...cookieJar.cookiesAll()].length != 3 ||
                [...cookieJar.cookiesDomain("foo.bar")].length != 1 ||
                [...cookieJar.cookiesDomain("bar.foo")].length != 1 ||
                [...cookieJar.cookiesDomain("localhost")].length != 1 ||
                [...cookieJar.cookiesDomain("abc.def")].length != 0 ||
                [...cookieJar.domains()].length != 3 ||
                [...cookieJar.cookiesValid(false)].length != 1 ||
                [...cookieJar.cookiesValid(true)].length != 3 ||
                [...cookieJar.cookiesValidForRequest("https://bar.foo/test")]
                    .length != 1 ||
                [...cookieJar.cookiesValidForRequest("http://foo.bar")]
                    .length != 1 ||
                [...cookieJar.cookiesValidForRequest("https://localhost")]
                    .length != 1 ||
                [...cookieJar.cookiesValidForRequest("http://localhost")]
                    .length != 0
            )
                return false;
            cookieJar.deleteExpired(false);
            if ([...cookieJar.cookiesAll()].length != 3) return false;
            cookieJar.deleteExpired(true);
            if ([...cookieJar.cookiesAll()].length != 1) return false;
            await cookieJar.save();
            cookieJar = new CookieJar("test.json");
            await cookieJar.load();
            if ([...cookieJar.cookiesAll()].length != 1) return false;
            return true;
        }
    ),
    new Test("CookieJar.addCookie()", async () => {
        const cookieStr = "foo=bar; Domain=";
        const cookieJar = new CookieJar();
        if (!cookieJar.addCookie("foo=bar", "https://foo.bar")) return false;
        return await Promise.race([
            new Promise(resolve => {
                cookieJar.cookieIgnoreCallback = eCookieStr =>
                    resolve(eCookieStr === cookieStr);
                cookieJar.addCookie(cookieStr, "https://foo.bar");
            }),
            new Promise(resolve => setTimeout(resolve.bind(this, false), 10))
        ]);
    })
];
