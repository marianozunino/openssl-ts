[![build](https://github.com/marianozunino/morpheus/actions/workflows/build_deploy.yml/badge.svg)](https://github.com/marianozunino/morpheus/actions/workflows/build_deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/marianozunino/openssl-ts/badge.svg)](https://coveralls.io/github/marianozunino/openssl-ts)
![node-current](https://img.shields.io/node/v/openssl-ts)
![npm type definitions](https://img.shields.io/npm/types/openssl-ts)
[![current-version](https://img.shields.io/badge/dynamic/json?label=current-version&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmarianozunino%2Fopenssl-ts%2Fmaster%2Fpackage.json)](https://npmjs.com/package/openssl-ts)
# Openssl Ts

Openssl-ts is a modern openssl **wrapper** written in typescript with 0 dependencies.

This library is not responsible of doing any filesystem operations (read/write).
It just handles the openssl calls.

Output from openssl should be **handled by the caller (you)**.

> This project has been testing with Node >= v8.17 and with openssl >= 1.1.1m


# Installation

Using npm:
```sh
npm install openssl-ts
```

or using the [Yarn](https://yarnpkg.com) package manager:
```sh
yarn add openssl-ts
```

# Usage

The signature is pretty simple:

First parameter is an array of strings (openssl arguments).
The second parameter is an optional object with the following properties:
- `opensslPath`: path to the openssl executable.

  You can override this by using the `OPENSSL_PATH` environment variable as well.

  Default: `openssl` (must be in the PATH)
- `stdin`: buffer to be passed to openssl as stdin 

  This would be like using `cat` and piping the input to openssl.

  example: `cat private.key | openssl rsa -check`

  Why would you want to do this?
  Simple, sometimes you have the content already on ram and you want to pass it to openssl without the need to first write it to a file.

  **Notice**: `cat` is not being used to pipe the input to openssl.


# Examples

<details>
  <summary>Using <b>out</b> flag</summary>

```ts
import { openssl } from 'openssl-ts';

const output = await openssl(['genrsa', '-out', 'private.key', '2048']);

// output is a Buffer
console.log(output.toString());
/*
Generating RSA private key, 2048 bit long modulus (2 primes)
................................................+++++
...........+++++
e is 65537 (0x010001)
*/
// if you want the private.key content, you should read the file from the filesystem
```
</details>

<details>
  <summary>Without <b>out</b> flag</summary>

```ts
import { openssl } from 'openssl-ts';

const output = await openssl(['genrsa', '2048']);

// output is a Buffer
console.log(output.toString());

/*
Generating RSA private key, 2048 bit long modulus (2 primes)
....................................................................+++++
.............................+++++
e is 65537 (0x010001)
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAoNKO2MDD9TzZ9KpSJ7JAuIWDhTY5qZJGbgUltnUKqTts+A7s
...
-----END RSA PRIVATE KEY-----
*/

// if you want just the key you must parse the output

```
</details>


<details>
  <summary>Using <b>in</b> flag</summary>

```ts
import { openssl } from 'openssl-ts';

const output = await openssl(['rsa', '-in', 'private.key', '-check']);

// output is a Buffer
console.log(output.toString());


/*
RSA key ok
writing RSA key
-----BEGIN RSA PRIVATE KEY-----
....
-----END RSA PRIVATE KEY-----

*/
```
</details>


<details>
  <summary>Piping <b>STDIN</b> to openssl</summary>

```ts
import { openssl } from 'openssl-ts';

const buffer = readFileSync('private.key');

const output = await openssl(['rsa', 'check'], {
  stdin: buffer,
});

// output is a Buffer
console.log(output.toString());

/*
RSA key ok
writing RSA key
-----BEGIN RSA PRIVATE KEY-----
....
-----END RSA PRIVATE KEY-----

*/
```
</details>

<details>
	<summary>NestJS Example</summary>
	You can find an example of how to use this library in a NestJS project in the **examples** folder.
	PS: Is just the same as the previous examples, but with a NestJS service.
</details>



# Tests

Running all test:

```sh
yarn test
```

Running with coverage:

```sh
yarn test:cov
```


# Debugging

You can use the `NODE_DEBUG` environment variable to enable debugging.

Example:
```sh
NODE_DEBUG=openssl node yourscript.js
```

This will print the openssl command that will be executed and its parameters.
