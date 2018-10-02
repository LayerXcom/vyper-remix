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
      warningText: '',
      compileDst: "host"
    }

    this.onCompileFromRemix = this.onCompileFromRemix.bind(this)
    this.onCompileSucceeded = this.onCompileSucceeded.bind(this)
    this.onCompileFailed = this.onCompileFailed.bind(this)
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
    console.log(this.state.vyper)
    this.compile(this.onCompileSucceeded, this.onCompileFailed)
  }

  compile(onCompileSucceeded, onCompileFailed) {
    let compileURL
    const request = new XMLHttpRequest()
    if (this.state.compileDst === "host") {
      compileURL = ''
    } else if (this.state.compileDst === "local") {
      compileURL = 'http://localhost:8000/compile'
    }
    request.open('POST', compileURL)
    request.setRequestHeader('Content-Type', 'application/json')
    request.addEventListener("load", (event) => {
      const response = JSON.parse(event.target.responseText)
        if (event.target.statusCode == 200) {
          onCompileSucceeded(response)
        } else {
          onCompileFailed(response)
        }
    })
    request.addEventListener("error", () => {
      console.error("Network Error")
    })
    request.send(JSON.stringify({ "code": this.state.vyper }))
  }

  onCompileFailed(compileResults) {
    this.setState({compilationResult: compileResults})
  }

  onCompileSucceeded(compileResults) {
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
          "inputs": [{ "name": "CallData", "type": "string" }],
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
      extension.call('compiler', 'sendCompilationResult', [this.state.placeholderText, this.state.vyper, 'vyper', data]
      )
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
    const { anchorEl } = this.state;
    if ((typeof this.state.web3) === 'undefined') {
      this.state.warningText = 'WARNING: Metamask (Web3) not detected!';
    } else {
      this.state.warningText = '';
    }
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to the Vyper!</h1>
        </header>
        <div>
          <input type="radio" name="compile" value="host" onChange={() => this.setState({ compileDst: "host" })} checked={this.state.compileDst === 'host'} />Host
          <input type="radio" name="compile" value="local" onChange={() => this.setState({ compileDst: "local" })} checked={this.state.compileDst === 'local'} />Local
        </div>
        <div style={{ display: "flex", "flex-direction": "column", margin: "auto", width: "600px" }} >
          <h3 style={{ "text-align": "left", "color": "red" }}>{this.state.warningText}</h3>
          <div style={{ display: "flex", "flex-direction": "row", "margin-top": "1em" }}>
            <button disabled={this.state.loading || (typeof this.state.web3 === 'undefined')} variant="contained" color="primary" onClick={() => this.onCompileFromRemix()}>
              Compile Vyper code!!!
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
