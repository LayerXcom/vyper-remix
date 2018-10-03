import React, { Component } from 'react';
import "./remix-api";
import { Button, Message, Radio, Popup, Icon } from 'semantic-ui-react'
import { Helmet } from 'react-helmet'

var extension = new window.RemixExtension()

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      vyper: '',
      placeholderText: "Contract.vyper",
      TxType: 'Contract',
      txStatusText: "Deploy contract",
      loading: false,
      compileDst: "host",
      compilationResult: ''
    }

    this.onCompileFromRemix = this.onCompileFromRemix.bind(this)
    this.onCompileSucceeded = this.onCompileSucceeded.bind(this)
    this.onCompileFailed = this.onCompileFailed.bind(this)
  }

  onCompileFromRemix() {
    const plugin = this
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
    this.setState({ compilationResult: compileResults })
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

  render() {
    return (
      <div style={{ "textAlign": "center" }}>
        <Helmet>
          <style>{'body { background-color: #F0F3FE; }'}</style>
        </Helmet>
        <div style={{ display: "inline" }}>
          <h1 style={{ marginTop: "1em" }}>Vyper plug-in</h1>
          <p>v 1.0.0</p>
        </div>
        <div style={{ background: "white", margin: "1em 2em", padding: "1.5em 0" }}>
          <Radio type="radio" name="compile" value="host" onChange={() => this.setState({ compileDst: "host" })} checked={this.state.compileDst === 'host'} label="Host" />
          <Popup trigger={<Icon name="question circle" />}
            content="[Recommended] You can compile the vyper code using remote server."
            basic
          />
          <Radio type="radio" name="compile" value="local" onChange={() => this.setState({ compileDst: "local" })} checked={this.state.compileDst === 'local'} label="Local" style={{ marginLeft: "1em" }} />
          <Popup trigger={<Icon name="question circle" />}
            content="You can use your own compiler using your localhost server."
            basic
          />

          <div>
            <div style={{ "marginTop": "2em" }}>
              <Button disabled={this.state.loading} primary onClick={() => this.onCompileFromRemix()}>
                Compile
            </Button>
            </div>
          </div>
          <div style={{ marginTop: "1em" }}>
            {this.state.compilationResult.status ? <Message warning>{`compilation result: ${this.state.compilationResult.status}`}</Message> : ''}
            {this.state.compilationResult.status === 'failed' ? <Message warning>{`reason: ${this.state.compilationResult.message}`}</Message> : ''}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
