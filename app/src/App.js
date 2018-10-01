import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import "./remix-api";

var extension = new window.RemixExtension()

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      vyper: '',
      vyperURL: '',
      remotevyperURL: false,
      anchorEl: null,
      placeholderText: "Contract.vyper",
      TxType: 'Contract',
      txModalOpen: false,
      txStatusText: "Deploy contract",
      loading: false,
      warningText: ''
    }

    this.onCompileFromRemix = this.onCompileFromRemix.bind(this)
    this.onCompileToRemix = this.onCompileToRemix.bind(this)
    this.sendCompilationResult = this.sendCompilationResult.bind(this)

  }

  onCompileFromRemix(e) {
    var plugin = this
    extension.call('editor', 'getCurrentFile', [], function (error, result) {
      console.log(error, result)
      plugin.setState({
        placeholderText: result[0]
      })
      extension.call('editor', 'getFile', result, (error, result) => {
        console.log(result)
        plugin.setState({
          vyper: result[0]
        })
      })
    })
  }

  compile(cb) {
    const request = new XMLHttpRequest()
    request.open('POST', 'http://localhost:8000/compile')
    request.setRequestHeader('Content-Type', 'application/json')
    request.addEventListener("load", (event) => {
        if (event.target.status !== 200) {
            console.log(`${event.target.status}: ${event.target.statusText}`)
            return
        }
        console.log(event.target.status)
        console.log(event.target.responseText)
        const response = JSON.parse(event.target.responseText)
        cb(response)
    })
    request.addEventListener("error", () => {
        console.error("Network Error")
    })
    request.send(JSON.stringify({"code": this.state.vyper}))
  }

  sendCompilationResult(compileResults) {
    // In vyper-serve.py,
    // out_dict = {
    //   'abi': compiler.mk_full_signature(code),
    //   'bytecode': '0x' + compiler.compile(code).hex(),
    //   'ir': str(optimizer.optimize(parse_to_lll(code)))
    // }
    var abi = compileResults['abi']
    var bytecode = compileResults['bytecode']
    var data = {
      'sources': {},
      'contracts': {}
    }
    data['sources'][this.state.placeholderText] = { id: 1, ast: {} }
    data['contracts'][this.state.placeholderText] = {}
    // If the language used has no contract names, this field should equal to an empty string.
    data['contracts'][this.state.placeholderText][this.state.placeholderText.split('/').slice(-1)[0].split('.')[0]] = {
      // The Ethereum Contract ABI. If empty, it is represented as an empty array.
      // See https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI
      "abi": [
        {
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "fallback",
            "inputs": [{"name": "CallData", "type": "string"}],
        } 
      ],
      "evm": {
        "bytecode": {
          "linkReferences": {

          },
            "object": bytecode,
            "opcodes": ""
          }
        }
      },
      /*
       * data['contracts'][this.state.placeholderText]['ewasm'] = {
       *       "vyper": vyper,
       *       "wasm": wasm
       *}
       */
    extension.call('compiler', 'sendCompilationResult', [this.state.placeholderText, this.state.vyper, 'vyper', data]
    )
  }

  onCompileToRemix(e) {
    console.log(this.state.vyper)
    this.compile(this.sendCompilationResult)
  }

  componentWillMount() {
    window.addEventListener('load', () => {
      this.setState({
        web3: window.web3
      })
    })
    this.setState({ anchorEl: null });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to the Vyper!</h1>
        </header>
        <div style={{ display: "flex", "flex-direction": "column", margin: "auto", width: "600px" }} >
          <h3 style={{ "text-align": "left", "color": "red" }}>{this.state.warningText}</h3>
          <div style={{ display: "flex", "flex-direction": "row", "margin-top": "1em" }}>
            <button disabled={this.state.loading || (typeof this.state.web3 === 'undefined')} variant="contained" color="primary" onClick={() => this.onCompileFromRemix()}>
              Get file from remix
            </button>
            <button disabled={this.state.loading || (typeof this.state.web3 === 'undefined')} variant="contained" color="primary" onClick={() => this.onCompileToRemix()} style={{ "margin-left": "20px" }}>
              Send contract to remix
            </button>
          </div>
      </div>
    </div>
    );
  }
}

export default App;
