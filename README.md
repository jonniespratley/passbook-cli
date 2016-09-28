#passbook-cli

[![Build Status](https://travis-ci.org/jonniespratley/passbook-cli.svg?branch=master)](https://travis-ci.org/jonniespratley/passbook-cli)




## Description

A command line tool that simplifies the process of creating certificates, signing `.raw` packages and validating `.pkpass` packages for Apple Wallet.

## Usage

To install passbook-cli from npm, run:

```
$ npm install -g passbook-cli
```

```
$ passbook-cli --help
```


## CLI


Create pem certificate and key for signing a .raw package.

```
$ passbook create-pems \
	--input=./src/certificates/pass.io.passbookmanager.test.p12 \
	--output=./temp \
	--passphrase=test
```

Create .pkpass package from a .raw package.

```
$ passbook create-pass \
	--name=test-pass \
	--type=coupon \
	--output=./temp
```

```
$ passbook

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
