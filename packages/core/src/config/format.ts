import path from 'node:path'
import { IHlink } from '../IHlink.js'
import getGlobs from '../utils/getGlobs.js'
import {
  chalk,
  checkPathExist,
  findParentRelative,
  log,
  warning,
} from '../utils/index.js'

function join(arr: string[]) {
  return chalk.gray(arr.join(` ${chalk.cyan('>')} `))
}

async function formatConfig<T extends IHlink.Options>(config: T) {
  warning(
    !config || !config.pathsArray || !config.pathsArray.length,
    '至少配置一个路径'
  )

  // const sources = Object.keys(config.pathsMapping)

  const exists = await Promise.all(
    (config.pathsArray || []).map(
      async ({ source }) => await checkPathExist(source)
    )
  )

  const filterPaths = (config.pathsArray || []).filter(
    ({ source, target }, i) => {
      const paths = findParentRelative([source, target])
      if (!path.isAbsolute(source) || !path.isAbsolute(target)) {
        log.warn(join(paths), '路径都必须为绝对路径，已过滤')
        return false
      }
      if (source === target) {
        log.warn(join(paths), '源路径和目标路径不能相同，已过滤')
        return false
      }
      const exist = exists[i]
      if (!exist) {
        log.warn(join(paths), '源路径不存在，已过滤')
      }
      return exist
    }
  )
  // const sourcesAfterFilter = sources.filter((src, i) => {
  //   const dest = config.pathsMapping[src]
  //   const paths = findParentRelative([src, dest])
  //   if (!path.isAbsolute(src) || !path.isAbsolute(dest)) {
  //     log.warn(join(paths), '路径都必须为绝对路径，已过滤')
  //     return false
  //   }
  //   if (src === dest) {
  //     log.warn(join(paths), '源路径和目标路径不能相同，已过滤')
  //     return false
  //   }
  //   const exist = exists[i]
  //   if (!exist) {
  //     log.warn(join(paths), '源路径不存在，已过滤')
  //   }
  //   return exist
  // })

  warning(!filterPaths?.length, '过滤后，没有一个路径满足要求')

  // const pathsMapping = sourcesAfterFilter.reduce<Record<string, string>>(
  //   (result, p) => {
  //     result[p] = config.pathsMapping[p]
  //     return result
  //   },
  //   {}
  // )
  let includeGlobs = getGlobs(config.include, ['**'])
  const excludeGlobs = getGlobs(config.exclude)
  return {
    ...config,
    include: includeGlobs,
    exclude: excludeGlobs,
    pathsArray: filterPaths,
  }
}

export default formatConfig
