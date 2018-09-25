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
    this.handleChange = this.handleChange.bind(this)
    this.setContract = this.setContract.bind(this)
    this.setTx = this.setTx.bind(this)
    this.onTx = this.onTx.bind(this)
    this.handleTxModalClose = this.handleTxModalClose.bind(this)
    this.onAddressChange = this.onAddressChange.bind(this)
    this.onValueUpdated = this.onValueUpdated.bind(this)

  }

  componentWillMount() {
    window.addEventListener('load', () => {
      this.setState({
        web3: window.web3
      })
    })
    this.setState({ anchorEl: null });
  }

  onAddressChange(e) {
    if (e.target.value !== "") {
      console.log('calling setTx...')
      this.setTx()
    }
    if (e.target.value === "") {
      console.log('calling setContract...')
      this.setContract()
    }

    this.setState({
      to: e.target.value
    })
  }

  handleChange(e) {
    this.setState({
      vyper: e.target.value
    })
  }

  handleTxModalClose() {
    this.setState({ txModalOpen: false })
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

  compile() {
    const request = new XMLHttpRequest()
    request.open("POST", `http://localhost:8000/compile`)
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener("load", (event) => {
        if (event.target.status !== 200) {
            console.log(`${event.target.status}: ${event.target.statusText}`)
            return
        }
        console.log(event.target.status)
        console.log(event.target.responseText)
        const res = event.target.responseText
    })
    request.addEventListener("error", () => {
        console.error("Network Error")
    })
    request.send(JSON.stringify({"code": this.state.vyper}))
    request.abort()
    return res
    // function buf2hex(buffer) { // buffer is an ArrayBuffer
    //   return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    // }

    // let wasm = ''
    // let vyper = ""
    // // nest this into a function
    // try {
    //   let module = window.Binaryen.parseText(this.state.vyper)
    //   wasm = buf2hex(module.emitBinary())
    // } catch (e) {
    //   alert(e)
    //   //TODO do something here
    // }

    // for (let i = 0; i < wasm.length; i += 2) {
    //   vyper += "\\" + wasm.slice(i, i + 2)
    // }

    // console.log(vyper)
    // vyper = `(module (import "ethereum" "finish" (func $finish (param i32 i32))) (memory 100) (data (i32.const 0)  "${vyper}") (export "memory" (memory 0)) (export "main" (func $main)) (func $main (call $finish (i32.const 0) (i32.const ${wasm.length / 2}))))`

    // try {
    //   let module = window.Binaryen.parseText(vyper)
    //   wasm = buf2hex(module.emitBinary())
    // } catch (e) {
    //   alert(e)
    //   //TODO do something here
    // }
    // return { 'vyper': vyper, 'wasm': wasm }
  }

  onCompileToRemix(e) {
    console.log(this.state.vyper)
    var compileResults = this.compile()
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
      "abi": abi,
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
      extension.call('compiler', 'sendCompilationResult', [this.state.placeholderText, vyper, 'vyper', data]
      )
  }

  onSubmitTx(e) {
    console.log('onSubmitTx clicked.')

    this.setState({
      txStatusText: "Transaction Pending"
    })

    var compileResults = this.compile()
    // In vyper-serve.py, 
      // out_dict = {
      //   'abi': compiler.mk_full_signature(code),
      //   'bytecode': '0x' + compiler.compile(code).hex(),
      //   'ir': str(optimizer.optimize(parse_to_lll(code)))
      // }
    var abi = compileResults['abi']
    var bytecode = compileResults['bytecode']
    // this might be a problem, because it triggers a re-render..
    this.setState({ loading: true })

    let txn = {}

    if (bytecode.length > 0)
      txn.data = bytecode

    if (this.state.to)
      txn.to = this.state.to

    console.log('this.state.value:', this.state.value)
    if (this.state.value) {
      let value = parseInt(this.state.value)
      if (!value) {
        alert("must input number as value")
        throw ("foobar")
      } else {
        console.log('got tx value:', value)
        txn.value = value
      }
    }

    this.state.web3.eth.sendTransaction(txn, (e, tx) => {
      if (e) throw (e)
      /*
      this.state.web3.eth.getTransactionReceipt(tx, (e, txn) => {
        if (e) throw(e)
        if (txn) {
          cb(txn)
        }
        }
      })
    */
      let state = this.state
      let onTx = this.onTx.bind(this)
      let onTxDone = false
      let blockCount = 0

      //let filter = this.state.web3.eth.filter("latest")

      // bind the filter to the watch function's `this` so that I can call `filter.stopWatching` within

      let latestBlockNum = null

      let interval = window.setInterval(() => {
        state.web3.eth.getBlock("latest", (e, block) => {
          if (e) throw (e)  //TODO make this not get swallowed

          if (latestBlockNum) {
            if (block.number <= latestBlockNum) {
              return
            }
          }
          latestBlockNum = block.number

          for (let i = 0; i < block.transactions.length; i++) {
            if (tx == block.transactions[i]) {
              state.web3.eth.getTransactionReceipt(tx, (e, txn) => {
                if (e) throw (e) //TODO make this not get swallowed

                if (txn) {
                  // filter.stopWatching()
                  // TODO add this ^ back in after figuring out why it doesn't work with cpp-ethereum

                  clearInterval(interval)
                  this.setState({ txStatusText: "Deploy contract" })
                  onTx(txn)
                }
              })
              break
            }
          }

          blockCount++
          if (blockCount > 10) {
            alert("transaction was not included in the last 10 blocks... assuming dropped")
            clearInterval(interval)
          }
        })
      }, 100)
    })
  }

  onTx(tx) {
    //alert(tx.status === "1" ? "transaction succeeded" : "transaction failed")
    this.setState({ txModalOpen: true, loading: false, txData: tx })
  }

  onValueUpdated(e) {
    console.log('onValueUpdated:', e.target.value)
    this.setState({
      value: e.target.value
    })
  }

  onSelectChange(e) {
    this.setState({
      placeholderText: e.target.selectedOptions[0].value
    })
  }

  handleClose(e) {
    this.setState({ anchorEl: null });
  }

  setContract(e) {
    this.setState({
      placeholderText: "Contract Code (vyper)",
      TxType: 'Contract'
    })
    this.setState({ anchorEl: null });
  }

  setTx(e) {
    this.setState({
      placeholderText: "Transaction Data",
      TxType: 'Transaction'
    })
    this.setState({ anchorEl: null });
  }

  handleClick(e) {
    if (this.state.vyperURL.substring(0, 4) === 'http') {
      this.setState({ remotevyperURL: true })
    } else {
      //get the file from remix
    }
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
          <h2 style={{ "text-align": "left" }}> Destination Address</h2>
          <textarea
            placeholder="Enter an address to send normal transaction. Leave blank to send contract creation tx."
            onChange={this.onAddressChange}
            style={{ "background-color": this.state.TxType === "Contract" ? "rgb(220,220,220)" : "rgb(256, 256, 256)" }}
            // disabled={this.state.TxType === "Contract"}
            rows="1"
            cols="80">
          </textarea>
          <h2 style={{ "text-align": "left" }}> Value (Wei) </h2>
          <textarea onChange={this.onValueUpdated} rows="1" cols="80" ></textarea>
          <textarea onChange={this.handleChange} style={{ display: "none", "float": "left" }} rows="20" cols="80" id="editor"></textarea>

          {/*<Fetch url={this.state.vyper}
          onResponse={(error, response) => {
            this.handleClick()
          }}
        >
        {({ doFetch }) => (          
          <div style={{display: "flex", "flex-direction": "row", "margin-top": "1em"}}>
            <Button disabled={this.state.loading || (typeof this.state.web3 === 'undefined')} variant="contained" color="primary" onClick={() => this.doFetch()}>
              Load file
            </Button>
        </Fetch>*/
          }

          <div style={{ display: "flex", "flex-direction": "row", "margin-top": "1em" }}>
            <button disabled={this.state.loading || (typeof this.state.web3 === 'undefined')} variant="contained" color="primary" onClick={() => this.onSubmitTx()}>
              {this.state.txStatusText}
            </button>
            {/* <div style={{ "padding-top": "5px", "padding-left": "20px" }}>
              <PulseLoader color={'#123abc'} loading={this.state.loading} />
            </div> */}
          </div>
        </div>


        {/* <TxModal open={this.state.txModalOpen} onClose={this.handleTxModalClose} tx={this.state.txData}></TxModal> */}
      </div>
    );
  }
}

export default App;
