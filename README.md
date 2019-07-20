# node-fetch-cookies
A [node-fetch](https://github.com/bitinn/node-fetch) wrapper with support for cookies.
It supports reading/writing from/to a JSON cookie jar and keeps cookies in memory until you call `CookieJar.save()` to reduce disk I/O.

## Usage Example
```javascript
import {fetch, CookieJar} from "node-fetch-cookies";

(async () => {
    // creates a CookieJar instance
    let cookieJar = new CookieJar("rw", "jar.json");

    // usual fetch usage, except with one or multiple cookie jars as first parameter
    const response = await fetch(cookieJar, "https://google.de");

    // save the received cookies to disk
    cookieJar.save();
})();
```

## Documentation

### fetch(cookieJar, url, options)
- `cookieJar` A [CookieJar](#class-cookiejar) instance or an array of CookieJar instances
- `url` and `options` as in https://github.com/bitinn/node-fetch#fetchurl-options


### Class: CookieJar
A class that stores cookies.

#### Properties
- `flags` The read/write flags as specified below.
- `file` The path of the cookie jar on the disk.
- `cookies` A [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) mapping cookie names to their properties.

#### new CookieJar(flags[, file, cookies])
- `flags` A string specifying whether cookies should be read and/or written from/to the jar when passing it as parameter to [fetch](#fetchcookiejar-url-options).
    - `r`: only read from this jar
    - `w`: only write to this jar
    - `rw` or `wr`: read/write from/to this jar
- `file` An optional string containing a relative or absolute path to the file on the disk to use.
- `cookies` An optional initializer for the cookie jar - either an array of [Cookie](#class-cookie) instances or a single Cookie instance.

#### addCookie(cookie[, url])
Adds a cookie to the jar.
- `cookie` A [Cookie](#class-cookie) instance to add to the cookie jar. Alternatively this can also be a string, for example the string received from a website. In this case `url` should be specified.
- `url` The url a cookie has been received from.

#### forEach(callback)
Just a wrapper for `CookieJar.cookies.forEach(callback)`.

#### save()
Saves the cookie jar to disk. Only non-expired cookies are saved.


### Class: Cookie
An abstract representation of a cookie.

#### Properties
- `name` The identifier of the cookie.
- `value` The value of the cookie.
- `expiry` A [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object of the cookies expiry date.
- `domain` The domain the cookie is valid for.
- `path` The path the cookie is valid for.
- `secure` A boolean value representing the cookie's secure attribute. If set the cookie will only be used for `https` requests.
- `subdomains` A boolean value specifying whether the cookie should be used for subdomains of the domain or not.

#### new Cookie(cookie, url)
- `cookie` The string representation of a cookie as send by a webserver.
- `url` The url the cookie has been received from.

#### static fromObject(obj)
Creates a cookie instance from an already existing object with the same properties.

#### serialize()
Serializes the cookie, transforming it to `name=value` so it can be used in requests.

#### hasExpired()
Returns whether the cookie has expired or not.

#### isValidForRequest(url)
Returns whether the cookie is valid for a request to `url`. If not, it won't be send by the fetch wrapper.

## License
This project is licensed under the MIT license, see [LICENSE](LICENSE).
