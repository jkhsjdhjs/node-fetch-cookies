# node-fetch-cookies
node-fetch wrapper that adds support for cookie-jars

## Example Usage
```javascript
import cookies from "node-fetch-cookies";
// "rw" are the flags, meaning cookies will be read and written from/to the cookie jar. r = read, w = write
// second argument is the filename, can also be undefined if you don't want to read/write the cookies from/to a file
let cookieJar = new cookies.CookieJar("rw", "path/to/file.json");
// first parameter is the url, second the options, just like node-fetch. third parameter is the cookie jar (can also be an array)
// returns a response object just like node-fetch
cookies.fetch("https://example.page/example/path", null, cookieJar);
```
