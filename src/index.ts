// https://juejin.cn/post/6844903956905197576#heading-3

import { parse } from '@babel/parser'
import generate from '@babel/generator'

import { check } from './validate'
import { isSaveDeclaration } from './collect'
import { startInsert } from './insert'

export default function(source: string) {
  // @ts-ignore
  const webpackEnv = this

  const { importPath, componentName, logError, isPage } = check(webpackEnv) || {}

  // 获取原始文件地址
  const codeFilePath = webpackEnv.resourcePath
  if (typeof isPage !== 'function' || !isPage(codeFilePath)) return source

  // 生成 AST
  const ast: any = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties'],
  })

  // 保存所有顶层的声明
  const declarations = new Map()

  // 如果插入过就返回
  if (isSaveDeclaration(ast, importPath, declarations)) return source

  const { importedDeclaration, importedComponent } = startInsert(ast, componentName, importPath, declarations)

  if ((!importedComponent || !importedDeclaration) && logError) {
    const tip = (!importedComponent && '组件') || !importedDeclaration || '导入声明'

    webpackEnv.emitWarning(
      `页面: ${codeFilePath} 注入${tip}失败，建议手动引入组件。组件注入限制请查阅: https://github.com/webpack-all-project/taro-inject-components-loader`,
    )
  }

  return generate(ast).code
}
