export function defaultJudgePage(filePath: string) {
  // 兼容 windows 路径
  const formatFilePath = filePath.replace(/\\/g, '/')
  return /(package-.+\/)?pages\/[A-Za-z0-9-]+\/index\.[tj]sx$/.test(formatFilePath)
}
