import { getOptions } from 'loader-utils'
import { validate } from 'schema-utils'
import { defaultJudgePage } from './path'

const schema = {
  type: 'object',
  properties: {
    importPath: {
      type: 'string',
    },
    logError: {
      type: 'boolean',
    },
    isPage: {
      instanceof: 'Function',
    },
  },
  additionalProperties: false,
}

// 检查元素是否符合规范
export const check = (webpackEnv: any) => {
  const options = getOptions(webpackEnv)
  validate(schema as any, options, { name: 'taro-inject-component-loader' })

  return {
    importPath: '',
    componentName: 'WebpackInjected',
    logError: true,
    isPage: defaultJudgePage,
    ...options,
  }
}
