# vyper-remix
Vyper Plugin for Remix IDE.

## Installation
```npm install```

## How to use
1. Write vyper code(.vy) in the editor
2. Click Compile button
3. Now you can deploy the contract in the Run tab!

## Dependencies
Integration to remix-ide and hosting of remote plugin server & Vyper compiler server is WIP.

### remix-ide
This plugin work with remix-ide [alpha version](https://remix-alpha.ethereum.org).
Instead, you can use a local plugin server with the latest master branch of [remix-ide](https://github.com/ethereum/remix-ide).

### Vyper
If you use a local Vyper compiler you need to use the vyper-serve in the latest master branch of [Vyper](https://github.com/ethereum/vyper).
First, you need to install Vyper(see [docs](https://vyper.readthedocs.io/en/latest/installing-vyper.html#installing-vyper)).
Then, Vyper compiler starts with this(default: http://localhost:8000).
```vyper-serve```
