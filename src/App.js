import React, { Component } from 'react';
import "./remix-api";
import { Button, Radio, Popup, Icon, Menu, Segment, Message, Form, TextArea, Header, Image } from 'semantic-ui-react'
import { Helmet } from 'react-helmet'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { ballot } from './example-contracts'

var extension = new window.RemixExtension()

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      vyper: '',
      placeholderText: 'Code *.vy!',
      loading: false,
      compileDst: "remote",
      compilationResult: {
        status: false,
        message: '',
        bytecode: '',
        bytecode_runtime: '',
        abi: '',
        ir: '',
        methodIdentifiers: ''
      },
      menu: {
        active: 'bytecode'
      },
      copied: false
    }

    this.onCompileFromRemix = this.onCompileFromRemix.bind(this)
    this.onCompileSucceeded = this.onCompileSucceeded.bind(this)
    this.highlightErrors = this.highlightErrors.bind(this)
    this.onCompileFailed = this.onCompileFailed.bind(this)
    this.onPluginLoaded = this.onPluginLoaded.bind(this)
    this.onClickTab = this.onClickTab.bind(this)

    this.onPluginLoaded()
  }

  onPluginLoaded() {
    extension.call('app', 'updateTitle', ['remix-vyper'])
    extension.call('editor', 'setFile', [`browser/${ballot.name}`, ballot.content])
  }

  onCompileFromRemix() {
    this.setState({ compilationResult: {status: "inProgress" }})
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
    if (!this.state.placeholderText) {
      onCompileFailed({status: 'failed', message: "Set your Vyper contract file."})
      return
    }
    const extension = this.state.placeholderText.split('.')[1]
    if (extension !== 'vy') {
      onCompileFailed({status: 'failed', message: "Use extension .vy for Vyper."})
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
    var methodIdentifiers = JSON.parse(JSON.stringify(compileResults['method_identifiers']).replace(/0x/g,''))
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
        },
        "methodIdentifiers": methodIdentifiers
      }
    }
      extension.call('compiler', 'sendCompilationResult', [this.state.placeholderText, this.state.vyper, 'vyper', data])
  }

  createCompilationResultMessage(fileName, result) {
    if(result.status == 'success') {
      return {
        bytecode: this.state.compilationResult['bytecode'],
        bytecode_runtime: this.state.compilationResult['bytecode_runtime'],
        abi: JSON.stringify(this.state.compilationResult['abi'], null , "\t"),
        ir: this.state.compilationResult['ir']
      }
    } else if(result.status == 'failed' && result.column && result.line) {
      const header = `${fileName}:${result.line}:${result.column}`
      const body = this.state.compilationResult.message.split(/\r\n|\r|\n/)
      const arr = [header].concat(body).join("\n")
      return {
        bytecode: arr,
        bytecode_runtime: arr,
        abi: arr,
        ir: arr
      }
    } else if(result.status == 'failed') {
      const message = this.state.compilationResult.message
      return {
        bytecode: message,
        bytecode_runtime: message,
        abi: message,
        ir: message
      }
    }
    return {
      bytecode: "",
      bytecode_runtime: "",
      abi: "",
      ir: ""
    }
  }

  onClickTab(e, {name}) {
    this.setState({menu: {active: name}})
  }

  renderBytecode(message) {
    return (
      <Message><pre class="bytecode">{message}</pre></Message>
    )
  }

  renderText(message) {
    return (
      <Form><Form.TextArea value={message} rows={20}/></Form>
    )
  }

  renderCompilationResult(fileName, result) {
    const activeItem = this.state.menu.active
    const message = this.createCompilationResultMessage(fileName, result)[activeItem];
    return (
      <div>
        <Menu pointing secondary attached='top' widths={4}>
          <Menu.Item active={activeItem == 'bytecode'} name="bytecode" onClick={this.onClickTab} menuItem>
            bytecode
          </Menu.Item>
          <Menu.Item active={activeItem == 'bytecode_runtime'} name="bytecode_runtime" onClick={this.onClickTab} menuItem>
            runtime bytecode
          </Menu.Item>
          <Menu.Item active={activeItem == 'abi'} name="abi" onClick={this.onClickTab} menuItem>
            abi
          </Menu.Item>
          <Menu.Item active={activeItem == 'ir'} name="ir" onClick={this.onClickTab} menuItem>
            LLL
          </Menu.Item>
        </Menu>

        <Segment attached='bottom'>
          {(['abi', 'ir'].indexOf(activeItem) >= 0) ? this.renderText(message) : this.renderBytecode(message)}
        </Segment>
      </div>
    )
  }

  render() {
    return (
      <div style={{ "textAlign": "center" }}>
        <Helmet>
          <style>{'body { background-color: #F0F3FE; }'}</style>
        </Helmet>
        <div style={{ marginTop: "1em" }}>
          <Header as='h1'>
            <Image src="./logo.svg" />
            <Header.Content>
              Vyper Plugin
              <Popup trigger={<Icon size='tiny' name="question circle" />}>
                <div>1. Write vyper code(.vy) in the editor</div>
                <div>2. Click Compile button</div>
                <div>3. Now you can deploy the contract in the Run tab!</div>
              </Popup>
            </Header.Content>
            <a href="https://github.com/LayerXcom/vyper-remix" target="_blank" align="right" style={{"text-decoration": "none"}}>
                <i aria-hidden="true" class="github icon"></i>
            </a>
          </Header>

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
          <div style={{ "marginTop": "1em" }}>
            <Button icon primary content='Compile' icon='sync'  disabled={this.state.loading} primary onClick={() => this.onCompileFromRemix()} />
            <CopyToClipboard text={this.createCompilationResultMessage(this.state.placeholderText, this.state.compilationResult)[this.state.menu.active]} onCopy={() => this.setState({copied: true})}>
              <Button icon primary content='Copy' icon='copy'  disabled={this.state.loading} primary />
            </CopyToClipboard>
          </div>
          <div style={{ "marginTop": "1em" }}>
            {this.state.placeholderText}
          </div>
          <div style={{ "marginTop": "1em" }}>
            {this.renderCompilationResult(this.state.placeholderText, this.state.compilationResult)}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
