import utils from '@babel/types'

function createElement(name: string) {
  const reactIdentifier = utils.identifier('React')
  const createElementIdentifier = utils.identifier('createElement')
  const callee = utils.memberExpression(reactIdentifier, createElementIdentifier)
  return utils.callExpression(callee, [utils.identifier(name)])
}

function createJSX(name: string) {
  return utils.jSXElement(utils.jSXOpeningElement(utils.jsxIdentifier('' + name), [], true), null, [], true)
}

export function insertComponent(node: any, componentName: string, importedComponent: any) {
  if (node?.type === 'ReturnStatement') {
    // createElement
    if (node.argument?.callee?.property?.name === 'createElement' && !importedComponent) {
      importedComponent = true
      const reactCreateArguments = node.argument.arguments
      reactCreateArguments.push(createElement(componentName))
    }

    // JSX
    if (node.argument?.type === 'JSXElement' && !importedComponent) {
      importedComponent = true
      node.argument.children.push(createJSX(componentName))
    }
  }

  if (node.type === 'JSXElement' && !importedComponent) {
    node.children.push(createJSX(componentName))
  }

  return importedComponent
}
