import React, { useContext } from 'react'
import {
  isVyper, contractName,
  Contract,
  compile,
  toStandardOutput,
  VyperCompilationOutput,
  isCompilationError,
  RemixClientContext
} from '../utils'
import Button from 'react-bootstrap/Button'

interface Props {
  compilerUrl: string
  contract?: Contract,
  setOutput: (name: string, output: VyperCompilationOutput) => void
}

function CompilerButton({ contract, setOutput, compilerUrl }: Props) {

  const remixClient = useContext(RemixClientContext)

  if (!contract || !contract.name) {
    return <Button disabled>No contract selected</Button>
  }

  const name = contractName(contract.name)
  if (!isVyper(name)) {
    return <Button disabled>Not a vyper contract</Button>
  }

  /** Compile a Contract */
  async function compileContract() {
    try {
      const _contract = await remixClient.getContract()
      remixClient.changeStatus({
        key: 'loading',
        type: 'info',
        title: 'Compiling'
      })
      const output = await compile(compilerUrl, _contract)
      setOutput(_contract.name, output)
      // ERROR
      if (isCompilationError(output)) {
        const line = output.line
        const lineColumnPos = {
          start: { line: line - 1 },
          end: { line: line - 1 }
        }
        remixClient.highlight(lineColumnPos as any, _contract.name, '#e0b4b4')
        throw new Error(output.message)
      }
      // SUCCESS
      remixClient.discardHighlight()
      remixClient.changeStatus({
        key: 'succeed',
        type: 'success',
        title: 'succeed'
      })
      const data = toStandardOutput(_contract.name, output)
      remixClient.compilationFinish(_contract.name, _contract.content, data)
    } catch (err) {
      remixClient.changeStatus({
        key: 'failed',
        type: 'error',
        title: err.message
      })
    }
  }

  return (
    <Button onClick={compileContract} variant="primary">
      Compiler {name}
    </Button>
  )
}

export default CompilerButton
