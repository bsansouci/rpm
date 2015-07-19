# Rust-Package-Manager
Reminiscent of NPM, targeted to Cargo, Rust's package manager.

_Dependencies_: [babel-node](https://babeljs.io/docs/setup/#babel_cli) and [request](https://github.com/request/request)

## install
```sh
npm i
```

Add this to your `.bashrc` or `.zshrc`
```sh
alias rpm="babel-node path/to/rpm/cargo-install.js "
```

## Usage
Search:
```sh
rpm s hyper
```


Search:
```sh
rpm i hyper
```
