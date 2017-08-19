#passbook-cli

[![Build Status](https://travis-ci.org/jonniespratley/passbook-cli.svg?branch=master)](https://travis-ci.org/jonniespratley/passbook-cli)


## Docs
Visit the doclets site.




## Description

A command line tool that simplifies the process of creating certificates, signing `.raw` packages and validating `.pkpass` packages for Apple Wallet.

## Install
To install passbook-cli from npm, run:

```
$ npm install -g passbook-cli
```

## Usage

```
$ passbook-cli --help
```

### 1. Create Certificates and Key
Create `pem` certificate and `key` for signing a `.raw` pass package.

```
$ passbook create-pems \
	--input=./src/certificates/pass.io.passbookmanager.test.p12 \
	--output=./temp \
	--passphrase=test
```

### 2. Create `.pkpass`
Create a `.pkpass` package from a `.raw` package.

```
$ passbook create-pass \
	--name=test-pass \
	--type=coupon \
	--output=./temp
```

## Command available

```
$ passbook-cli
$ passbook
```

```
Commands:

    create-pass [options]  Create a .raw pass package from pass type templates.
    create-pems [options]  Create the required certkmifcate and key from a .p12
    config [key] [value]   Get and set options

  Options:

    -h, --help     output usage information
    -d, --debug    enable debugger
    -V, --version  output the version number

  Examples:

    $ custom-help --help
    $ custom-help -h

$ passbook create-pems --input ./src/certificates/pass.io.passbookmanager.test.p12 --passphrase test --output ./tmp
```





```

export PASS_TYPE_IDENTIFIER=pass.io.passbookmanager.test
 718  export TEAM_IDENTIFIER=USE9YUYDFH
```



## License
Copyright (c) 2016 Jonnie Spratley
[MIT License](http://en.wikipedia.org/wiki/MIT_License)


## Acknowledgments
Built using [generator-commader](https://github.com/Hypercubed/generator-commander).
