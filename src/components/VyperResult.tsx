import React, { useState, useContext } from 'react';
import {
  VyperCompilationResult,
  VyperCompilationOutput,
  isCompilationError,
  RemixClientContext
} from '../utils';
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import { Ballot } from '../examples/ballot';
import Button from 'react-bootstrap/Button';
import JSONTree from 'react-json-view'
import CopyToClipboard from 'react-copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'


interface VyperResultProps {
  output?: VyperCompilationOutput;
}

function VyperResult({ output }: VyperResultProps) {
  const [ active, setActive ] = useState<keyof VyperCompilationResult>('abi');
  const remixClient = useContext(RemixClientContext)
  
  if (!output) return (
    <div id="result">
      <p>No contract compiled yet.</p>
      <Button variant="info" onClick={() => remixClient.loadContract(Ballot)}>
        Create Ballot.vy example
      </Button>
    </div>
  )

  if (isCompilationError(output)) {
    return (
    <div id="result" className="error">
      <FontAwesomeIcon icon={faExclamationCircle} style={{color:"var(--danger)"}}/>
      <p>{output.message}</p>
    </div>)
  }

  return (
    <Tabs id="result" activeKey={active} onSelect={(key: any) => setActive(key)}>
      <Tab eventKey="abi" title="ABI">
        <CopyToClipboard text={JSON.stringify(output.abi)}>
          <Button className="copy">Copy ABI</Button>
        </CopyToClipboard>
        <JSONTree src={output.abi} />
      </Tab>
      <Tab eventKey="bytecode" title="Bytecode">
        <CopyToClipboard text={output.bytecode}>
          <Button className="copy">Copy Bytecode</Button>
        </CopyToClipboard>
        <textarea defaultValue={output.bytecode}></textarea>
      </Tab>
      <Tab eventKey="bytecode_runtime" title="Runtime Bytecode">
        <CopyToClipboard text={output.bytecode_runtime}>
          <Button className="copy">Copy Runtime Bytecode</Button>
        </CopyToClipboard>
        <textarea defaultValue={output.bytecode_runtime}></textarea>
      </Tab>
      <Tab eventKey="ir" title="LLL">
        <CopyToClipboard text={output.ir}>
          <Button className="copy">Copy LLL Code</Button>
        </CopyToClipboard>
        <textarea defaultValue={output.ir}></textarea>
      </Tab>
    </Tabs>
  );
}

export default VyperResult;