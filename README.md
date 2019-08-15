# node-fetch-cookies
A [node-fetch](https://github.com/bitinn/node-fetch) wrapper with support for cookies.
It supports reading/writing from/to a JSON cookie jar and keeps cookies in memory until you call `CookieJar.save()` to reduce disk I/O.

## Usage Examples
### with file...
```javascript
import {fetch, CookieJar} from "node-fetch-cookies";

(async () => {
    // creates a CookieJar instance
    const cookieJar = new CookieJar("rw", "jar.json");

    // usual fetch usage, except with one or multiple cookie jars as first parameter
    const response = await fetch(cookieJar, "https://example.com");

    // save the received cookies to disk
    cookieJar.save();
})();
```

### ...or without
```javascript
import {fetch, CookieJar} from "node-fetch-cookies";

(async () => {
    const cookieJar = new CookieJar("rw");

    // log in to some api
    let response = await fetch(cookieJar, "https://example.com/api/login", {
        method: "POST",
        body: "credentials"
    });

    // do some requests you require login for
    response = await fetch(cookieJar, "https://example.com/api/admin/drop-all-databases");

    // and optionally log out again
    response = await fetch(cookieJar, "https://example.com/api/logout");
})();
```

## Documentation

### async fetch(cookieJar, url, options)
- `cookieJar` A [CookieJar](#class-cookiejar) instance, an array of CookieJar instances or null, if you don't want to send or store cookies.
- `url` and `options` as in https://github.com/bitinn/node-fetch#fetchurl-options

Returns a Promise resolving to a [Response](https://github.com/bitinn/node-fetch#class-response) instance on success.

### Class: CookieJar
A class that stores cookies.

#### Properties
- `flags` The read/write flags as specified below.
- `file` The path of the cookie jar on the disk.
- `cookies` A [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) mapping hostnames to maps, which map cookie names to the respective [Cookie](#class-cookie) instance.

#### new CookieJar(flags[, file, cookies])
- `flags` A string specifying whether cookies should be read and/or written from/to the jar when passing it as parameter to [fetch](#fetchcookiejar-url-options).
    - `r`: only read from this jar
    - `w`: only write to this jar
    - `rw` or `wr`: read/write from/to this jar
- `file` An optional string containing a relative or absolute path to the file on the disk to use.
- `cookies` An optional initializer for the cookie jar - either an array of [Cookie](#class-cookie) instances or a single Cookie instance.

#### addCookie(cookie[, fromURL])
Adds a cookie to the jar.
- `cookie` A [Cookie](#class-cookie) instance to add to the cookie jar.
Alternatively this can also be a string, for example a serialized cookie received from a website.
In this case `fromURL` must be specified.
- `fromURL` The url a cookie has been received from.

Returns `true` if the cookie has been added successfully. Returns `false` otherwise.
Will log a warning to console if a cookie fails to be parsed.

#### addFromFile(file)
Reads cookies from `file` on the disk and adds the contained cookies.

#### domains()
Returns an iterator over all domains currently stored cookies for.

#### *cookiesDomain(domain)
Returns an iterator over all cookies currently stored for `domain`.

#### *cookiesValid(withSession)
Returns an iterator over all valid (non-expired) cookies.
- `withSession`: A boolean. Iterator will include session cookies if set to `true`.

#### *cookiesAll()
Returns an iterator over all cookies currently stored.

#### *cookiesValidForRequest(url)
Returns an iterator over all cookies valid for a request to `url`.

#### deleteExpired(sessionEnded)
Removes all expired cookies from the jar.
- `sessionEnded`: A boolean. Also removes session cookies if set to `true`.

#### save()
Saves the cookie jar to disk. Only non-expired non-session cookies are saved.


### Class: Cookie
An abstract representation of a cookie.

#### Properties
- `name` The identifier of the cookie.
- `value` The value of the cookie.
- `expiry` A [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object of the cookies expiry date or `null`, if the cookie expires with the session.
- `domain` The domain the cookie is valid for.
- `path` The path the cookie is valid for.
- `secure` A boolean value representing the cookie's secure attribute. If set the cookie will only be used for `https` requests.
- `subdomains` A boolean value specifying whether the cookie should be used for requests to subdomains of `domain` or not.

#### new Cookie(str, url)
Creates a cookie instance from the string representation of a cookie as send by a webserver.
- `str` The string representation of a cookie.
- `url` The url the cookie has been received from.

Will throw a `CookieParseError` if `str` couldn't be parsed.

#### static fromObject(obj)
Creates a cookie instance from an already existing object with the same properties.

#### serialize()
Serializes the cookie, transforming it to `name=value` so it can be used in requests.

#### hasExpired(sessionEnded)
Returns whether the cookie has expired or not.
- `sessionEnded`: A boolean that specifies whether the current session has ended, meaning if set to `true`, the function will return `true` for session cookies.

#### isValidForRequest(url)
Returns whether the cookie is valid for a request to `url`.


## License
This project is licensed under the MIT license, see [LICENSE](LICENSE).
