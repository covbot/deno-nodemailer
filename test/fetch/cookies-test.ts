import Cookies, { Cookie } from '../../lib/fetch/cookies.ts';

import { describe, beforeEach, it } from 'https://deno.land/std@0.182.0/testing/bdd.ts';
import { assert, assertEquals, assertFalse, assertStrictEquals } from 'https://deno.land/std@0.182.0/testing/asserts.ts';

describe('Cookie Tests', function () {
    let biskviit: Cookies;

    beforeEach(function () {
        biskviit = new Cookies();
    });

    describe('#getPath', function () {
        it('should return root path', function () {
            assertStrictEquals(biskviit.getPath('/'), '/');
            assertStrictEquals(biskviit.getPath(''), '/');
            assertStrictEquals(biskviit.getPath('/index.php'), '/');
        });

        it('should return without file', function () {
            assertStrictEquals(biskviit.getPath('/path/to/file'), '/path/to/');
        });
    });

    describe('#isExpired', function () {
        it('should match expired cookie', function () {
            assertFalse(
                biskviit.isExpired({
                    name: 'a',
                    value: 'b',
                    expires: new Date(Date.now() + 10000)
                })
            );

            assert(
                biskviit.isExpired({
                    name: 'a',
                    value: '',
                    expires: new Date(Date.now() + 10000)
                })
            );

            assert(
                biskviit.isExpired({
                    name: 'a',
                    value: 'b',
                    expires: new Date(Date.now() - 10000)
                })
            );
        });
    });

    describe('#compare', function () {
        it('should match similar cookies', function () {
            assert(
                biskviit.compare(
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    },
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    }
                )
            );

            assertFalse(
                biskviit.compare(
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    },
                    {
                        name: 'yyy',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    }
                )
            );

            assertFalse(
                biskviit.compare(
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    },
                    {
                        name: 'zzz',
                        path: '/amp',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    }
                )
            );

            assertFalse(
                biskviit.compare(
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    },
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'examples.com',
                        secure: false,
                        httponly: false
                    }
                )
            );

            assertFalse(
                biskviit.compare(
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: false,
                        httponly: false
                    },
                    {
                        name: 'zzz',
                        path: '/',
                        domain: 'example.com',
                        secure: true,
                        httponly: false
                    }
                )
            );
        });
    });

    describe('#add', function () {
        it('should append new cookie', function () {
            assertStrictEquals(biskviit.cookies.length, 0);
            biskviit.add({
                name: 'zzz',
                value: 'abc',
                path: '/',
                expires: new Date(Date.now() + 10000),
                domain: 'example.com',
                secure: false,
                httponly: false
            });
            assertStrictEquals(biskviit.cookies.length, 1);
            assertStrictEquals(biskviit.cookies[0].name, 'zzz');
            assertStrictEquals(biskviit.cookies[0].value, 'abc');
        });

        it('should update existing cookie', function () {
            assertStrictEquals(biskviit.cookies.length, 0);
            biskviit.add({
                name: 'zzz',
                value: 'abc',
                path: '/',
                expires: new Date(Date.now() + 10000),
                domain: 'example.com',
                secure: false,
                httponly: false
            });
            biskviit.add({
                name: 'zzz',
                value: 'def',
                path: '/',
                expires: new Date(Date.now() + 10000),
                domain: 'example.com',
                secure: false,
                httponly: false
            });
            assertStrictEquals(biskviit.cookies.length, 1);
            assertStrictEquals(biskviit.cookies[0].name, 'zzz');
            assertStrictEquals(biskviit.cookies[0].value, 'def');
        });
    });

    describe('#match', function () {
        it('should check if a cookie matches particular domain and path', function () {
            const cookie: Cookie = {
                name: 'zzz',
                value: 'abc',
                path: '/def/',
                expires: new Date(Date.now() + 10000),
                domain: 'example.com',
                secure: false,
                httponly: false
            };
            assert(biskviit.match(cookie, 'http://example.com/def/'));
            assertFalse(biskviit.match(cookie, 'http://example.com/bef/'));
        });

        it('should check if a cookie matches particular domain and path', function () {
            const cookie: Cookie = {
                name: 'zzz',
                value: 'abc',
                path: '/def',
                expires: new Date(Date.now() + 10000),
                domain: 'example.com',
                secure: false,
                httponly: false
            };
            assert(biskviit.match(cookie, 'http://example.com/def/'));
            assertFalse(biskviit.match(cookie, 'http://example.com/bef/'));
        });

        it('should check if a cookie is secure', function () {
            const cookie: Cookie = {
                name: 'zzz',
                value: 'abc',
                path: '/def/',
                expires: new Date(Date.now() + 10000),
                domain: 'example.com',
                secure: true,
                httponly: false
            };
            assert(biskviit.match(cookie, 'https://example.com/def/'));
            assertFalse(biskviit.match(cookie, 'http://example.com/def/'));
        });
    });

    describe('#parse', function () {
        it('should parse Set-Cookie value', function () {
            assertEquals(biskviit.parse('theme=plain'), {
                name: 'theme',
                value: 'plain'
            });

            assertEquals(biskviit.parse('SSID=Ap4P….GTEq; Domain=foo.com; Path=/; Expires=Wed, 13 Jan 2031 22:23:01 GMT; Secure; HttpOnly'), {
                name: 'ssid',
                value: 'Ap4P….GTEq',
                domain: '.foo.com',
                path: '/',
                httponly: true,
                secure: true,
                expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
            });
        });

        it('should ignore invalid expire header', function () {
            assertEquals(biskviit.parse('theme=plain; Expires=Wed, 13 Jan 2031 22:23:01 GMT'), {
                name: 'theme',
                value: 'plain',
                expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
            });

            assertEquals(biskviit.parse('theme=plain; Expires=ZZZZZZZZ GMT'), {
                name: 'theme',
                value: 'plain'
            });
        });
    });

    describe('Listing', function () {
        beforeEach(function () {
            biskviit.cookies = [
                {
                    name: 'ssid1',
                    value: 'Ap4P….GTEq1',
                    domain: '.foo.com',
                    path: '/',
                    httponly: true,
                    secure: true,
                    expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
                },
                {
                    name: 'ssid2',
                    value: 'Ap4P….GTEq2',
                    domain: '.foo.com',
                    path: '/',
                    httponly: true,
                    secure: true,
                    expires: new Date('Wed, 13 Jan 1900 22:23:01 GMT')
                },
                {
                    name: 'ssid3',
                    value: 'Ap4P….GTEq3',
                    domain: 'foo.com',
                    path: '/',
                    httponly: true,
                    secure: true,
                    expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
                },
                {
                    name: 'ssid4',
                    value: 'Ap4P….GTEq4',
                    domain: 'www.foo.com',
                    path: '/',
                    httponly: true,
                    secure: true,
                    expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
                },
                {
                    name: 'ssid5',
                    value: 'Ap4P….GTEq5',
                    domain: 'broo.com',
                    path: '/',
                    httponly: true,
                    secure: true,
                    expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
                }
            ];
        });

        describe('#list', function () {
            it('should return matching cookies for an URL', function () {
                assertEquals(biskviit.list('https://www.foo.com'), [
                    {
                        name: 'ssid1',
                        value: 'Ap4P….GTEq1',
                        domain: '.foo.com',
                        path: '/',
                        httponly: true,
                        secure: true,
                        expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
                    },
                    {
                        name: 'ssid4',
                        value: 'Ap4P….GTEq4',
                        domain: 'www.foo.com',
                        path: '/',
                        httponly: true,
                        secure: true,
                        expires: new Date('Wed, 13 Jan 2031 22:23:01 GMT')
                    }
                ]);
            });
        });

        describe('#get', function () {
            it('should return matching cookies for an URL', function () {
                assertStrictEquals(biskviit.get('https://www.foo.com'), 'ssid1=Ap4P….GTEq1; ssid4=Ap4P….GTEq4');
            });
        });
    });

    describe('#set', function () {
        it('should set cookie', function () {
            // short
            biskviit.set('theme=plain', 'https://foo.com/');
            // long
            biskviit.set('SSID=Ap4P….GTEq; Domain=foo.com; Path=/test; Expires=Wed, 13 Jan 2031 22:23:01 GMT; Secure; HttpOnly', 'https://foo.com/');
            // subdomains
            biskviit.set('SSID=Ap4P….GTEq; Domain=.foo.com; Path=/; Expires=Wed, 13 Jan 2031 22:23:01 GMT; Secure; HttpOnly', 'https://www.foo.com/');
            // invalid cors
            biskviit.set('invalid_1=cors; domain=example.com', 'https://foo.com/');
            biskviit.set('invalid_2=cors; domain=www.foo.com', 'https://foo.com/');
            // invalid date
            biskviit.set('invalid_3=date; Expires=zzzz', 'https://foo.com/');
            // invalid tld
            biskviit.set('invalid_4=cors; domain=.co.uk', 'https://foo.co.uk/');
            // should not be added
            biskviit.set('expired_1=date; Expires=1999-01-01 01:01:01 GMT', 'https://foo.com/');

            assertEquals(
                biskviit.cookies.map(function (cookie) {
                    delete cookie.expires;
                    return cookie;
                }),
                [
                    {
                        name: 'theme',
                        value: 'plain',
                        domain: 'foo.com',
                        path: '/'
                    },
                    {
                        name: 'ssid',
                        value: 'Ap4P….GTEq',
                        domain: 'foo.com',
                        path: '/test',
                        secure: true,
                        httponly: true
                    },
                    {
                        name: 'ssid',
                        value: 'Ap4P….GTEq',
                        domain: 'www.foo.com',
                        path: '/',
                        secure: true,
                        httponly: true
                    },
                    {
                        name: 'invalid_1',
                        value: 'cors',
                        domain: 'foo.com',
                        path: '/'
                    },
                    {
                        name: 'invalid_2',
                        value: 'cors',
                        domain: 'foo.com',
                        path: '/'
                    },
                    {
                        name: 'invalid_3',
                        value: 'date',
                        domain: 'foo.com',
                        path: '/'
                    },
                    {
                        name: 'invalid_4',
                        value: 'cors',
                        domain: 'foo.co.uk',
                        path: '/'
                    }
                ]
            );
        });
    });
});
