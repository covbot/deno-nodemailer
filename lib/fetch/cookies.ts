// module to handle cookies

const SESSION_TIMEOUT = 1800; // 30 min

export type CookieOptions = {
    sessionTimeout?: number;
};

export type Cookie = {
    name: string;
    value?: string;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httponly?: boolean;
};

/**
 * Creates a biskviit cookie jar for managing cookie values in memory
 *
 * @constructor
 * @param [options] Optional options object
 */
export default class Cookies {
    public options: CookieOptions;
    public cookies: Cookie[];

    constructor(options: CookieOptions = {}) {
        this.options = options;
        this.cookies = [];
    }

    /**
     * Stores a cookie string to the cookie storage
     *
     * @param cookieStr Value from the 'Set-Cookie:' header
     * @param url Current URL
     */
    set(cookieStr: string, url: string) {
        let parsedUrl: URL | undefined;
        try {
            parsedUrl = new URL(url);
        } catch {
            return false;
        }

        const cookie = this.parse(cookieStr);

        if (cookie.domain) {
            const domain = cookie.domain.replace(/^\./, '');

            // do not allow cross origin cookies
            if (
                // can't be valid if the requested domain is shorter than current hostname
                parsedUrl.hostname.length < domain.length ||
                // prefix domains with dot to be sure that partial matches are not used
                ('.' + parsedUrl.hostname).slice(-domain.length + 1) !== '.' + domain
            ) {
                cookie.domain = parsedUrl.hostname;
            }
        } else {
            cookie.domain = parsedUrl.hostname;
        }

        if (!cookie.path) {
            cookie.path = this.getPath(parsedUrl.pathname);
        }

        // if no expire date, then use sessionTimeout value
        if (!cookie.expires) {
            cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1000);
        }

        return this.add(cookie);
    }

    /**
     * Returns cookie string for the 'Cookie:' header.
     *
     * @param url URL to check for
     * @returns Cookie header or empty string if no matches were found
     */
    get(url: string): string {
        return this.list(url)
            .map(cookie => cookie.name + '=' + cookie.value)
            .join('; ');
    }

    /**
     * Lists all valid cookie objects for the specified URL
     *
     * @param url URL to check for
     * @returns An array of cookie objects
     */
    list(url: string): Cookie[] {
        const result: Cookie[] = [];
        let i;
        let cookie;

        for (i = this.cookies.length - 1; i >= 0; i--) {
            cookie = this.cookies[i];

            if (this.isExpired(cookie)) {
                this.cookies.splice(i, i);
                continue;
            }

            if (this.match(cookie, url)) {
                result.unshift(cookie);
            }
        }

        return result;
    }

    /**
     * Parses cookie string from the 'Set-Cookie:' header
     *
     * @param cookieStr String from the 'Set-Cookie:' header
     * @returns Cookie object
     */
    parse(cookieStr: string): Cookie {
        const cookie: Partial<Cookie> = {};

        (cookieStr || '')
            .toString()
            .split(';')
            .forEach(cookiePart => {
                const valueParts = cookiePart.split('=');
                const firstPart = valueParts.shift();
                if (!firstPart) {
                    return;
                }
                const key = firstPart.trim().toLowerCase();
                const value = valueParts.join('=').trim();

                if (!key) {
                    // skip empty parts
                    return;
                }

                switch (key) {
                    case 'expires': {
                        const expiration = new Date(value);
                        // ignore date if can not parse it
                        if (!Number.isNaN(expiration.valueOf())) {
                            cookie.expires = expiration;
                        }
                        break;
                    }
                    case 'path':
                        cookie.path = value;
                        break;
                    case 'domain': {
                        let domain = value.toLowerCase();
                        if (domain.length && domain.charAt(0) !== '.') {
                            domain = '.' + domain; // ensure preceeding dot for user set domains
                        }
                        cookie.domain = domain;
                        break;
                    }

                    case 'max-age':
                        cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1000);
                        break;

                    case 'secure':
                        cookie.secure = true;
                        break;

                    case 'httponly':
                        cookie.httponly = true;
                        break;

                    default:
                        if (!cookie.name) {
                            cookie.name = key;
                            cookie.value = value;
                        }
                }
            });

        return cookie as Cookie;
    }

    /**
     * Checks if a cookie object is valid for a specified URL
     *
     * @param cookie Cookie object
     * @param url URL to check for
     * @returns true if cookie is valid for specifiec URL
     */
    match(cookie: Cookie, url: string): boolean {
        let parsedUrl: URL | undefined;
        try {
            parsedUrl = new URL(url);
        } catch {
            return false;
        }

        // Fail if cookie doesn't have all required properties.
        // In original nodemailer implementation, this function would just crash.
        if (!cookie.domain || !cookie.path) {
            return false;
        }

        // check if hostname matches
        // .foo.com also matches subdomains, foo.com does not
        if (
            parsedUrl.hostname !== cookie.domain &&
            (cookie.domain.charAt(0) !== '.' || ('.' + parsedUrl.hostname).slice(-cookie.domain.length) !== cookie.domain)
        ) {
            return false;
        }

        // check if path matches
        const path = this.getPath(parsedUrl.pathname);
        if (path.substr(0, cookie.path.length) !== cookie.path) {
            return false;
        }

        // check secure argument
        if (cookie.secure && parsedUrl.protocol !== 'https:') {
            return false;
        }

        return true;
    }

    /**
     * Adds (or updates/removes if needed) a cookie object to the cookie storage
     *
     * @param cookie Cookie value to be stored
     */
    add(cookie: Cookie): boolean {
        let i;
        let len;

        // nothing to do here
        if (!cookie || !cookie.name) {
            return false;
        }

        // overwrite if has same params
        for (i = 0, len = this.cookies.length; i < len; i++) {
            if (this.compare(this.cookies[i], cookie)) {
                // check if the cookie needs to be removed instead
                if (this.isExpired(cookie)) {
                    this.cookies.splice(i, 1); // remove expired/unset cookie
                    return false;
                }

                this.cookies[i] = cookie;
                return true;
            }
        }

        // add as new if not already expired
        if (!this.isExpired(cookie)) {
            this.cookies.push(cookie);
        }

        return true;
    }

    /**
     * Checks if two cookie objects are the same
     *
     * @param a Cookie to check against
     * @param b Cookie to check against
     * @returns True, if the cookies are the same
     */
    compare(a: Cookie, b: Cookie): boolean {
        return a.name === b.name && a.path === b.path && a.domain === b.domain && a.secure === b.secure && a.httponly === a.httponly;
    }

    /**
     * Checks if a cookie is expired
     *
     * @param cookie Cookie object to check against
     * @returns True, if the cookie is expired
     */
    isExpired(cookie: Cookie): boolean {
        return (cookie.expires && cookie.expires < new Date()) || !cookie.value;
    }

    /**
     * Returns normalized cookie path for an URL path argument
     *
     * @param pathname
     * @returns Normalized path
     */
    getPath(pathname: string): string {
        const pathSegments = (pathname || '/').split('/');
        pathSegments.pop(); // remove filename part
        let path = pathSegments.join('/').trim();

        // ensure path prefix /
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }

        // ensure path suffix /
        if (path.substr(-1) !== '/') {
            path += '/';
        }

        return path;
    }
}
