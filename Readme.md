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


```

 645  passbook-cli create-pems --input=./src/certificates/pass.io.passbookmanager.test.p12 --passphrase=test --output=./temp
 690  passbook-cli create-pass --type=coupon --output=./temp/pass.raw
```









## eventTicket
```

export PASS_TYPE_IDENTIFIER=pass.io.passbookmanager.test
 718  export TEAM_IDENTIFIER=USE9YUYDFH
```


## License

Copyright (c) 2016 Jonnie Spratley

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

## Acknowledgments

Built using [generator-commader](https://github.com/Hypercubed/generator-commander).