import traverse from '@babel/traverse'

export const isSaveDeclaration = (ast: babel.types.Node, importPath: String, declarations: Map<String, String>) => {
  let insert = false

  // path.node.type 当前的类型（是类还是函数...）
  // path.node.id.name 当前类的名称
  traverse(ast, {
    // 查找是否有导入
    ImportDeclaration(path) {
      // path.node 当前节点
      // path.node.source.value ast 中导入的路径值
      if (path.node.source.value === importPath) insert = true
    },

    // 类组件
    ClassDeclaration(path) {
      // 如果不是顶层的声明，则直接返回（为了收集顶层下有哪些声明）
      if (path.parent.type !== 'Program') return

      const type = path.node.type
      const name = path.node.id.name
      declarations.set(name, type)
    },

    // 函数声明
    FunctionDeclaration(path) {
      // 如果不是顶层的声明，则直接返回
      if (path.parent.type !== 'Program') return

      const type = path.node.type
      const name = path.node.id?.name
      if (!name) return

      declarations.set(name, type)
    },

    // 文件下最外层的表达式声明 const expression = ()=>{}
    VariableDeclaration(path) {
      // 如果不是顶层的声明，则直接返回
      if (path.parent.type !== 'Program') return

      path.node.declarations.forEach((declaration: any) => {
        if (declaration.init?.type === 'ArrowFunctionExpression') {
          const type = declaration.init?.type
          const name = declaration.id?.name

          declarations.set(name, type)
        }

        // const a = function(){}
        if (declaration.init?.type === 'FunctionExpression') {
          const type = declaration.init.type
          const name = declaration.id.name

          declarations.set(name, type)
        }

        // const a = class {}
        if (declaration.init?.type === 'ClassExpression') {
          const type = declaration.init.type
          const name = declaration.id.name

          declarations.set(name, type)
        }
      })
    },
  })

  return insert
}
