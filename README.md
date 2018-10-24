# vyper-remix
Vyper Plugin for Remix IDE.

## How to get started
### Remote plugin
This plugin is hosted at https://plugin.vyper.live.
To use it, open `Settings` tab and put this JSON in `plugin` section.
```
{
"title": "Vyper Plugin",
"url": "https://plugin.vyper.live"
}
```

### Local plugin
```npm install```
```npm start```

Put this JSON in `Settings` tab.
```
{
"title": "Vyper Plugin",
"url": "http://127.0.0.1:3000"
}
```

## How to use plugin
1. Write vyper code(.vy) in the editor
2. Click Compile button
3. Now you can deploy the contract in the Run tab!

## Dependencies
### remix-ide
This plugin work with remix-ide [alpha version](https://remix-alpha.ethereum.org).
The integration to the [production remix-ide](https://remix.ethereum.org) is WIP.

### Vyper
If you use a local Vyper compiler you need to use the vyper-serve in the latest master branch of [Vyper](https://github.com/ethereum/vyper). 
First, you need to install Vyper(see [docs](https://vyper.readthedocs.io/en/latest/installing-vyper.html#installing-vyper)).
Then, Vyper compiler starts with this(default: http://localhost:8000).
```vyper-serve```
