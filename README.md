# vyper-remix
Vyper Plugin for Remix IDE.

![image](https://user-images.githubusercontent.com/22876645/50035986-bb357980-0048-11e9-8994-91b2518e2aa6.png)


## How to get started
### Remote plugin
This plugin is hosted at https://plugin.vyper.live.
To use it, open `Settings` tab and click the `Vyper` button in the plugin section.

### Local plugin
You can host this plugin in your local.

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


### Local Vyper Compiler
You can use your local Vyper compiler by selecting the radio button `Local` .
First, you need to install Vyper. It is strongly recommended to install Vyper in a virtual Python environment.

```pip install vyper```

(see [installing-vyper](https://vyper.readthedocs.io/en/latest/installing-vyper.html#installing-vyper)).

Then, Vyper compiler starts with this command(default: http://localhost:8000).

```vyper-serve```
