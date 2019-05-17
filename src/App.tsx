import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

import { VyperCompilationOutput, Contract, RemixClient, RemixClientContext } from './utils'
import { CompilationResult } from 'remix-plugin'

// Components
import CompilerButton from './components/compiler-button'
import VyperResult from './components/VyperResult'
import LocalUrlInput from './components/local-url';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'

import vyperLogo from './logo.svg'
import './App.css'


interface AppState {
  status: 'idle' | 'inProgress'
  environment: 'remote' | 'local'
  compilationResult?: CompilationResult,
  localUrl: string
}

interface OutputMap {
  [fileName: string]: VyperCompilationOutput
}

const remixClient = new RemixClient()

const App: React.FC = () => {
  const [contract, setContract] = useState<Contract>({ name: '', content: '' })
  const [output, setOutput] = useState<OutputMap>({})
  const [state, setState] = useState<AppState>({
    status: 'idle',
    environment: 'remote',
    localUrl: 'http://localhost:8000/compile',
  })

  useEffect(() => {
    // When loaded
    remixClient.getContract().then(_contract => setContract(_contract))
    // When file changes
    remixClient.onFileChange(_contract => setContract(_contract))
  }, [])

  /** Update the environment state value */
  function setEnvironment(environment: 'local' | 'remote') {
    setState({ ...state, environment });
  }

  function setLocalUrl(url: string) {
    setState({ ...state, localUrl: url });
  }

  function compilerUrl() {
    return state.environment === 'remote'
      ? 'https://vyper.live/compile'
      : state.localUrl;
  }

  return (
    <RemixClientContext.Provider value={remixClient}>
      <main id="vyper-plugin">
        <header className="bg-light">
          <div className="title">
            <img src={vyperLogo} alt="Vyper logo" />
            <h4>yper Compiler</h4>
          </div>
          <a rel="noopener noreferrer" href="https://github.com/GrandSchtroumpf/vyper-remix" target="_blank" >
            <FontAwesomeIcon icon={faGithub}/>
          </a>
        </header>
        <section>
          <ToggleButtonGroup name="remote" onChange={setEnvironment} type="radio" value={state.environment}>
            <ToggleButton variant="secondary" name="remote" value="remote">
              Remote Compiler
            </ToggleButton>
            <ToggleButton variant="secondary" name="local" value="local">
              Local Compiler
            </ToggleButton>
          </ToggleButtonGroup>
          <LocalUrlInput
            url={state.localUrl}
            setUrl={setLocalUrl}
            environment={state.environment}/>
          <div id="compile-btn">
            <CompilerButton
              compilerUrl={compilerUrl()}
              contract={contract}
              setOutput={(name, update) => setOutput({...output, [name]: update})}/>
          </div>
          <article id="result">
            <VyperResult output={output[contract.name]} />
          </article>
        </section>
      </main>
    </RemixClientContext.Provider>
  )
}

export default App
