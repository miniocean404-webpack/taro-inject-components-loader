import traverse from '@babel/traverse'
import utils from '@babel/types'
import { insertComponent } from './element'

export const startInsert = (
  ast: babel.types.Node,
  componentName: String,
  importPath: String,
  declarations: Map<String, String>,
) => {
  // 记录组件插入状态
  let importedDeclaration = false
  let importedComponent = false

  traverse(ast, {
    // 添加声明
    ImportDeclaration(path) {
      if (!importedDeclaration) {
        importedDeclaration = true
        path.insertBefore(
          utils.importDeclaration(
            [utils.importDefaultSpecifier(utils.identifier('' + componentName))],
            utils.stringLiteral('' + importPath),
          ),
        )
      }
    },

    // 默认导出的为页面组件
    ExportDefaultDeclaration(path) {
      // 如果默认导出的是函数
      if (path.node.declaration.type === 'FunctionDeclaration') {
        const mainFnBody = path.node.declaration.body.body // 函数声明的函数体
        const length = mainFnBody.length
        const last = mainFnBody[length - 1]
        importedComponent = insertComponent(last, '' + componentName, importedComponent)
      }
      // 默认导出箭头函数
      if (path.node.declaration.type === 'ArrowFunctionExpression') {
        // export default () => { return <View></View> }
        if (path.node.declaration.body.type === 'BlockStatement') {
          const mainFnBody = path.node.declaration.body.body
          const length = mainFnBody.length
          const last = mainFnBody[length - 1]
          importedComponent = insertComponent(last, '' + componentName, importedComponent)
        } else {
          // export default () => <View></View>
          importedComponent = insertComponent(path.node.declaration.body, '' + componentName, importedComponent)
        }
      }

      // 默认导出类
      if (path.node.declaration.type === 'ClassDeclaration') {
        traverse(
          path.node,
          {
            ClassMethod(path) {
              if ((path.node.key as any).name === 'render') {
                const body = path.node.body.body || []
                const last = body[body.length - 1]
                importedComponent = insertComponent(last, '' + componentName, importedComponent)
                return
              }
            },
          },
          path.scope,
          path,
        )
      }

      // 如果默认导出的是一个声明
      if (path.node.declaration.type === 'Identifier') {
        const name = path.node.declaration.name
        const componentType = declarations.get(name)
        traverse(path.parent, {
          FunctionDeclaration(path) {
            if (path.node.id?.name !== name) return
            const mainFnBody = path.node?.body?.body
            const length = mainFnBody.length
            const last = mainFnBody[length - 1]
            importedComponent = insertComponent(last, '' + componentName, importedComponent)
          },
          ClassDeclaration(path) {
            if (path.node.id.name !== name) return
            traverse(
              path.node,
              {
                ClassMethod(path) {
                  if ((path.node.key as any)?.name !== 'render') return
                  const body = path.node.body.body || []
                  const last = body[body.length - 1]
                  importedComponent = insertComponent(last, '' + componentName, importedComponent)
                },
              },
              path.scope,
              path,
            )
          },
          VariableDeclarator(path) {
            if (path.node.id.type !== 'Identifier') return
            if (path.node.id.name !== name) return
            if (!path.node.init) return
            if (path.node.init.type !== componentType) return
            if (path.node.init.type === 'FunctionExpression') {
              const mainFnBody = path.node.init.body.body
              const length = mainFnBody.length
              const last = mainFnBody[length - 1]
              importedComponent = insertComponent(last, '' + componentName, importedComponent)
            }
            if (path.node.init.type === 'ClassExpression') {
              traverse(
                path.node,
                {
                  ClassMethod(path) {
                    if ((path.node.key as any).name !== 'render') return
                    const body = path.node.body.body || []
                    const last = body[body.length - 1]
                    importedComponent = insertComponent(last, '' + componentName, importedComponent)
                  },
                },
                path.scope,
                path,
              )
            }
            if (path.node.init.type === 'ArrowFunctionExpression') {
              // const A = () => {}
              // export default A
              if (path.node.init.body.type == 'BlockStatement') {
                const mainFnBody = path.node.init.body.body
                const length = mainFnBody.length
                const last = mainFnBody[length - 1]
                importedComponent = insertComponent(last, '' + componentName, importedComponent)
              } else {
                // const A = () => <div></div>
                // export default A
                importedComponent = insertComponent(path.node.init.body, '' + componentName, importedComponent)
              }
            }
          },
        })
      }
    },
  })

  return { importedDeclaration, importedComponent }
}
