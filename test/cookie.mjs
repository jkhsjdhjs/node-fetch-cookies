import Cookie from "../src/cookie.mjs";
import {CookieParseError} from "../src/errors.mjs";

export default Test => [
    new Test("new Cookie() / cookie parser", () => {
        const inputs = [
            [ // type error
                123,
                ""
            ],
            [ // type error
                "id=a3fWa",
                123
            ],
            [ // type error invalid url
                "id=a3fWa",
                ""
            ],
            [ // type error invalid url
                "id=a3fWa",
                "github.com"
            ],
            // TODO: fix this test case, parser shouldn't allow it. it is currently ignored
            [ // type error invalid url
                "id=a3fWa", 
                "https:abc/abs"
            ],
            [ // cookie parse error invalid cookie name
                "",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Oct 2015 07:28: GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Onv 2015 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Oct 20151 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 32 Oct 2015 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Oct 2015 25:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Oct 2015 07:61:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 UTC; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT+2; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=San, 21 Onv 2015 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Expires=Wed, 31 Dec 1969 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid value for expires
                "id=a3fWa; Max-Age=121252a; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid key secur
                "id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secur; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error invalid key HttpOly with value 2
                "id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure; HttpOly=2",
                "https://github.com"
            ],
            [ // cookie parse error not set via https
                "__Secure-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly",
                "http://github.com"
            ],
            [ // cookie parse error secure not set
                "__Secure-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error secure not set
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; HttpOnly; Path=/",
                "https://github.com"
            ],
            [ // cookie parse error not set via https
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly; Path=/",
                "http://github.com"
            ],
            [ // cookie parse error domain is set
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly; Domain=github.com; Path=/",
                "https://github.com"
            ],
            [ // cookie parse error path is not set
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // cookie parse error path is not equal to /
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly; Path=/lel/",
                "https://github.com"
            ],
            [ // cookie parse error domain is not a subdomain
                "id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Domain=github.com",
                "https://gist.github.com"
            ],
            [ // cookie parse error domain is not a subdomain
                "id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Domain=npmjs.com",
                "https://gist.github.com"
            ],
            [ // success
                "__Secure-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly",
                "https://github.com"
            ],
            [ // success
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly; Path=/",
                "https://github.com"
            ],
            [ // success
                "__Host-id=a3fWa; Expires=Wed, 21 Nov 2099 20:28:33 GMT; Secure; HttpOnly; Path=/",
                "https://github.com"
            ],
            [ // success
                "id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly; Path=/lul/; Domain=.usercontent.github.com",
                "https://github.com"
            ],
            [ // success
                "id=a3fWa; Expires=Wed, 21 Nov 2015 07:28:00 GMT; Secure; HttpOnly; SameSite=Strict; Path=/lul/; Domain=usercontent.github.com",
                "https://github.com"
            ],
            [ // success max-age takes precendence over expires
                "id=a3fWa; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=1000",
                "https://github.com"
            ],
            [ // success max-age takes precendence over expires
                "id=\"a3fWa\"; Max-Age=1000; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                "https://github.com"
            ],
        ];

        const catchErrorTest = (input, catchFnc) => {
            try {
                new Cookie(...input);
                return false;
            }
            catch(error) {
                return catchFnc(error);
            }
        };

        const catchErrorTypeMessageTest = (input, type, message) => catchErrorTest(input, e => e instanceof type && e.message === message);

        const compareCookieProps = (input, expiryFnc, properties) => {
            const cookie = new Cookie(...input);
            return Object.entries(properties).every(([prop, value]) => cookie[prop] === value)
                && expiryFnc(cookie.expiry);
        };

        return inputs.slice(0, 3).every(input => catchErrorTest(input, e => e instanceof TypeError))

        // cookies[4] is the test case that is ignored for now

        && catchErrorTypeMessageTest(inputs[5], CookieParseError, "Invalid cookie name \"\"!")
        && catchErrorTypeMessageTest(inputs[6], CookieParseError, "Invalid value for Expires \"Wed, 21 Oct 2015 07:28: GMT\"!")
        && catchErrorTypeMessageTest(inputs[7], CookieParseError, "Invalid value for Expires \"Wed, 21 Onv 2015 07:28:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[8], CookieParseError, "Invalid value for Expires \"Wed, 21 Oct 20151 07:28:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[9], CookieParseError, "Invalid value for Expires \"Wed, 32 Oct 2015 07:28:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[10], CookieParseError, "Invalid value for Expires \"Wed, 21 Oct 2015 25:28:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[11], CookieParseError, "Invalid value for Expires \"Wed, 21 Oct 2015 07:61:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[12], CookieParseError, "Invalid value for Expires \"Wed, 21 Oct 2015 07:28:00 UTC\"!")
        && catchErrorTypeMessageTest(inputs[13], CookieParseError, "Invalid value for Expires \"Wed, 21 Oct 2015 07:28:00 GMT+2\"!")
        && catchErrorTypeMessageTest(inputs[14], CookieParseError, "Invalid value for Expires \"San, 21 Onv 2015 07:28:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[15], CookieParseError, "Invalid value for Expires \"Wed, 31 Dec 1969 07:28:00 GMT\"!")
        && catchErrorTypeMessageTest(inputs[16], CookieParseError, "Invalid value for Max-Age \"121252a\"!")
        && catchErrorTypeMessageTest(inputs[17], CookieParseError, "Invalid key \"secur\" specified!")
        && catchErrorTypeMessageTest(inputs[18], CookieParseError, "Invalid key \"httpoly\" with value \"2\" specified!")

        && inputs.slice(19, 21).every(input => catchErrorTypeMessageTest(input, CookieParseError, "Cookie has \"__Secure-\" prefix but \"Secure\" isn't set or the cookie is not set via https!"))

        && inputs.slice(21, 26).every(input => catchErrorTypeMessageTest(input, CookieParseError, "Cookie has \"__Host-\" prefix but \"Secure\" isn't set, the cookie is not set via https, \"Domain\" is set or \"Path\" is not equal to \"/\"!"))

        && catchErrorTypeMessageTest(inputs[26], CookieParseError, "Invalid value for Domain \"github.com\": cookie was received from \"gist.github.com\"!")
        && catchErrorTypeMessageTest(inputs[27], CookieParseError, "Invalid value for Domain \"npmjs.com\": cookie was received from \"gist.github.com\"!")

        && compareCookieProps(
            inputs[28],
            exp => exp.getTime() === new Date("Wed, 21 Nov 2015 07:28:00 GMT").getTime(),
            {
                name: "__Secure-id",
                value: "a3fWa",
                secure: true,
                domain: "github.com",
                subdomains: false,
                path: "/"
            }
        )

        && compareCookieProps(
            inputs[29],
            exp => exp.getTime() === new Date("Wed, 21 Nov 2015 07:28:00 GMT").getTime(),
            {
                name: "__Host-id",
                value: "a3fWa",
                secure: true,
                domain: "github.com",
                subdomains: false,
                path: "/"
            }
        )

        && compareCookieProps(
            inputs[30],
            exp => exp.getTime() === new Date("Wed, 21 Nov 2099 20:28:33 GMT").getTime(),
            {
                name: "__Host-id",
                value: "a3fWa",
                secure: true,
                domain: "github.com",
                subdomains: false,
                path: "/"
            }
        )

        && compareCookieProps(
            inputs[31],
            exp => exp.getTime() === new Date("Wed, 21 Nov 2015 07:28:00 GMT").getTime(),
            {
                name: "id",
                value: "a3fWa",
                secure: true,
                domain: "usercontent.github.com",
                subdomains: true,
                path: "/lul/"
            }
        )

        && compareCookieProps(
            inputs[32],
            exp => exp.getTime() === new Date("Wed, 21 Nov 2015 07:28:00 GMT").getTime(),
            {
                name: "id",
                value: "a3fWa",
                secure: true,
                domain: "usercontent.github.com",
                subdomains: true,
                path: "/lul/"
            }
        )

        && compareCookieProps(
            inputs[33],
            exp => exp.getTime() > new Date("Thu, 01 Jan 1970 00:00:00 GMT").getTime(),
            {
                name: "id",
                value: "a3fWa",
                secure: false,
                domain: "github.com",
                subdomains: false,
                path: "/"
            }
        )

        && compareCookieProps(
            inputs[34],
            exp => exp.getTime() > new Date("Thu, 01 Jan 1970 00:00:00 GMT").getTime(),
            {
                name: "id",
                value: "a3fWa",
                secure: false,
                domain: "github.com",
                subdomains: false,
                path: "/"
            }
        );
    }),
    new Test("static Cookie.fromObject()", () => {
        const date = new Date();
        const inputs = [
            {
                name: "testname",
                value: "somevalue",
                secure: false,
                domain: "github.com",
                subdomains: false,
                path: "/",
                expiry: "2019-12-25T03:58:52.000Z"
            },
            {
                name: "testname",
                domain: "somedomain.tld",
                path: "/lel/",
                expiry: date,
                secure: true,
                subdomains: true,
                value: "lul"
            }
        ];

        const cookies = inputs.map(i => Cookie.fromObject(i));

        return cookies[0].name === "testname"
            && cookies[0].value === "somevalue"
            && cookies[0].domain === "github.com"
            && cookies[0].path === "/"
            && cookies[0].expiry.getTime() === new Date(inputs[0].expiry).getTime()
            && cookies[0].secure === false
            && cookies[0].subdomains === false

            && cookies[1].name === "testname"
            && cookies[1].value === "lul"
            && cookies[1].domain === "somedomain.tld"
            && cookies[1].path === "/lel/"
            && cookies[1].expiry.getTime() === date.getTime()
            && cookies[1].secure === true
            && cookies[1].subdomains === true;
    }),
    new Test("Cookie.serialize()", () => {
        return new Cookie("abc=def; Expires=Wed, 20 Oct 2018 08:08:08 GMT; Path=/", "https://somedomain.tld").serialize() === "abc=def"
            && new Cookie("jkhsd231=ajkshdgi", "https://somedomain.tld").serialize() === "jkhsd231=ajkshdgi";
    })
];
