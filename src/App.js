import React, { Component } from 'react';
import "./remix-api";
import { Button, Radio, Popup, Icon } from 'semantic-ui-react'
import { Helmet } from 'react-helmet'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Ballot } from './example-contracts'

var extension = new window.RemixExtension()

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      vyper: '',
      placeholderText: "Contract.vy",
      loading: false,
      compileDst: "remote",
      compilationResult: '',
      copied: false
    }

    this.onCompileFromRemix = this.onCompileFromRemix.bind(this)
    this.onCompileSucceeded = this.onCompileSucceeded.bind(this)
    this.highlightErrors = this.highlightErrors.bind(this)
    this.onCompileFailed = this.onCompileFailed.bind(this)
    this.onPluginLoaded = this.onPluginLoaded.bind(this)

    this.onPluginLoaded()
  }

  onPluginLoaded() {
    extension.call('app', 'updateTitle', ['remix-vyper'])
    extension.call('editor', 'setFile', [`browser/${Ballot.name}`, Ballot.content])
  }

  onCompileFromRemix() {
    this.setState({ compilationResult: "inProgress" })
    const plugin = this
    plugin.result = {}
    extension.call('editor', 'getCurrentFile', [], (error, result) => {
      console.log(error, result)
      plugin.result.placeholderText = result[0]
      plugin.result.copied = false
      extension.call('editor', 'getFile', result, (error, result) => {
        console.log(result)
        plugin.result.vyper = result[0]
        plugin.setState(plugin.result)
        plugin.compile(plugin.onCompileSucceeded, plugin.onCompileFailed, plugin.result)
      })
    })
  }

  compile(onCompileSucceeded, onCompileFailed, result) {
    const extension = this.state.placeholderText.split('.')[1]
    if (extension !== 'vy') {
      onCompileFailed({status: 'failed', message: `"${extension}" isn't Vyper extension.`})
      return
    }
    let compileURL
    const request = new XMLHttpRequest()
    if (this.state.compileDst === "remote") {
      compileURL = 'https://vyper.live/compile'
    } else if (this.state.compileDst === "local") {
      compileURL = 'http://localhost:8000/compile'
    }
    request.open('POST', compileURL)
    request.setRequestHeader('Content-Type', 'application/json')
    request.addEventListener("load", (event) => {
      switch (event.target.status) {
        case 200:
        case 400:
          const response = JSON.parse(event.target.responseText)
          if (event.target.status == 200) {
            console.log(response)
            onCompileSucceeded(response)
          } else {
            onCompileFailed(response, result.placeholderText)
          }
          break

        case 404:
          onCompileFailed({status: 'failed', message: `Vyper compiler not found at "${compileURL}".`})
          break

        default:
          onCompileFailed({status: 'failed', message: `Unknown error has occurred at "${compileURL}". ${event.target.responseText}`})
          break
      }
    })
    request.addEventListener("error", () => {
      onCompileFailed({status: 'failed', message: `Network error has occurred at "${compileURL}".`})
    })
    request.send(JSON.stringify({ "code": result.vyper }))
  }

  highlightErrors(fileName, line, color) {
    const lineColumnPos = {start: {line: line - 1}, end: {line: line - 1}}
    const obj = [JSON.stringify(lineColumnPos), fileName, color]
    extension.call('editor', 'highlight', obj, (error, result) => {})
  }

  onCompileFailed(compileResults, fileName) {
    this.setState({ compilationResult: compileResults })
    if(fileName && compileResults.line) {
      this.highlightErrors(fileName, compileResults.line, '#e0b4b4')
    }
  }

  onCompileSucceeded(compileResults) {
    this.setState({ compilationResult: compileResults })
    extension.call('editor', 'discardHighlight', [], (error, result) => {})
    var abi = compileResults['abi']
    var bytecode = compileResults['bytecode'].replace('0x','')
    var deployedBytecode = compileResults['bytecode_runtime'].replace('0x','')
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
      "abi": abi,
      "evm": {
        "bytecode": {
          "linkReferences": {

          },
          "object": bytecode,
          "opcodes": ""
        },
        "deployedBytecode": {
          "linkReferences": {

          },
          "object": deployedBytecode,
          "opcodes": ""
        }
      }
    },
      extension.call('compiler', 'sendCompilationResult', [this.state.placeholderText, this.state.vyper, 'vyper', data]
      )
  }

  renderCompilationResult(fileName, result) {
    if(result.status == 'inProgress') {
      return ''
    } else if(result.status == 'success') {  
      return (
        <div class="ui positive message">
          <div class="header">
            Succeeded!
          </div>
          <p />
          <CopyToClipboard text={this.state.compilationResult.bytecode} 
          onCopy={() => this.setState({copied: true})}>
          <button class="ui labeled icon button">
            <i class="copy icon"></i>
            Copy bytecode to clipboard
          </button>
          </CopyToClipboard>
          <p />
          <div>
            {this.state.copied ? <span style={{color: 'red'}}>Copied.</span> : null}
          </div>
        </div>
      )
    } else if(result.status == 'failed' && result.column && result.line) {
      const messages = this.state.compilationResult.message.split(/\r\n|\r|\n/)
      return (
        <div class="ui error message">
          <div class="header">
            Failed!
          </div>
          <p />
          <div class="content">
            {`${fileName}:${result.line}:${result.column}`}
            <p>
              {messages.map(m => <span>{m}<br /></span>)}
            </p>
          </div>
        </div>
      )
    } else if(result.status == 'failed'){
      return (
        <div class="ui error message">
          <div class="header">
            failed!
          </div>
          <p />
          <div class="content">
            {this.state.compilationResult.message}
          </div>
        </div>
      )
    }
  }

  render() {
    return (
      <div style={{ "textAlign": "center" }}>
        <Helmet>
          <style>{'body { background-color: #F0F3FE; }'}</style>
        </Helmet>
        <div style={{ display: "inline" }}>
          <h1 style={{ marginTop: "1em" }}>Vyper Plugin</h1>
          <p>v 1.0.0</p>
        </div>
        <div style={{ background: "white", margin: "1em 2em", padding: "1.5em 0" }}>
          <Radio type="radio" name="compile" value="remote" onChange={() => this.setState({ compileDst: "remote" })} checked={this.state.compileDst === 'remote'} label="Remote" />
          <Popup trigger={<Icon name="question circle" />}
            content="You can use remote compiler"
            basic
          />
          <Radio type="radio" name="compile" value="local" onChange={() => this.setState({ compileDst: "local" })} checked={this.state.compileDst === 'local'} label="Local" style={{ marginLeft: "1em" }} />
          <Popup trigger={<Icon name="question circle" />}
            content="You can use your own compiler at localhost:8000"
            basic
          />

          <div>
            <div style={{ "marginTop": "2em" }}>
              <Button disabled={this.state.loading} primary onClick={() => this.onCompileFromRemix()}>
                Compile
            </Button>
            <Popup trigger={<Icon name="question circle" />}>  
                <div>1. Write vyper code(.vy) in the editor</div>
                <div>2. Click Compile button</div>
                <div>3. Now you can deploy the contract in the Run tab!</div>
              </Popup>
            </div>
          </div>
          <p />
          <div>
            {this.renderCompilationResult(this.state.placeholderText, this.state.compilationResult)}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
