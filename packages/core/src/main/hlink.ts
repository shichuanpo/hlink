import HLinkError from '../core/HlinkError.js'
import { saveCache } from '../utils/cacheHelp.js'
import execAsyncByGroup from '../utils/execAsyncByGroup.js'
import {
  getDirBasePath,
  log,
  asyncMap,
  createTimeLog,
  endLog,
  chalk,
} from '../utils/index.js'
import { cachePath } from '../utils/paths.js'
import getProgressBar from '../utils/progress.js'
import analyse, { WaitLinks } from './analyse.js'
import { IOptions as IHlinkOptions } from './index.js'
import link from './link.js'

export interface IOptions extends Omit<IHlinkOptions, 'include' | 'exclude'> {
  include: string[]
  exclude: string[]
  watchInterval?: number
}
const time = createTimeLog()
async function hlink(options: IOptions) {
  const {
    // pathsMapping,
    pathsArray = [],
    openCache = false,
    mkdirIfSingle = true,
    keepDirStruct = true,
    include,
    exclude,
  } = options
  log.info('当前配置如下')
  log.info(
    '包含规则:',
    chalk.magenta(include.join(',') === '**' ? '所有文件' : include.join(','))
  )
  log.info(
    '排查规则:',
    chalk.magenta(exclude.length ? exclude.join(',') : '无')
  )
  log.info('缓存:', chalk.magenta(openCache ? '已打开' : '已关闭'))
  log.info('保持原有目录结构:', chalk.magenta(keepDirStruct ? '是' : '否'))
  log.info('为独立文件创建文件夹:', chalk.magenta(mkdirIfSingle ? '是' : '否'))
  // const sourcePaths = Object.keys(pathsMapping)

  const waitLinkFiles: WaitLinks[] = []
  const excludeFiles = []
  const existFiles = []
  const cacheFiles = []
  const parseResults = []
  time.start()
  log.info('任务开始!')
  log.info(`共计 ${chalk.magenta(pathsArray.length)} 个分析任务`)
  ;(
    await asyncMap(pathsArray, (item: { source: string; target: string }) => {
      return analyse({
        source: item.source,
        dest: item.target,
        include,
        exclude,
        openCache,
        mkdirIfSingle,
        keepDirStruct,
      })
    })
  ).forEach((item) => {
    waitLinkFiles.push(...item.waitLinkFiles)
    excludeFiles.push(...item.excludeFiles)
    existFiles.push(...item.existFiles)
    cacheFiles.push(...item.cacheFiles)
    parseResults.push(...item.parseResults)
  })

  log.info('共计', chalk.magenta(parseResults.length), '个文件')
  log.info('不满足配置的文件', chalk.yellow(excludeFiles.length), '个')
  log.info('已存在硬链的文件', chalk.yellow(existFiles.length), '个')
  openCache &&
    log.info(
      '缓存的创建记录',
      chalk.yellow(cacheFiles.length),
      `条${
        cacheFiles.length > 0
          ? ', 如果需要重新创建，请在删除或编辑文件 ' + chalk.cyan(cachePath)
          : ''
      }`
    )
  if (waitLinkFiles.length) {
    log.info('需要硬链的文件', chalk.cyan(waitLinkFiles.length), '个')
  } else {
    log.info('没有需要硬链的文件')
  }

  let successCount = 0
  let failCount = 0
  const failReasons: Record<string, string[]> = {}
  if (waitLinkFiles.length) {
    const bar = getProgressBar(waitLinkFiles.length)
    await execAsyncByGroup({
      groupSize: Math.min(66, Math.ceil(waitLinkFiles.length / 10)),
      waitExecArray: waitLinkFiles,
      callback: async (pathObj) => {
        try {
          await link(
            pathObj.sourcePath,
            pathObj.destDir,
            pathObj.originalSource,
            pathObj.originalDest
          )
          successCount += 1
        } catch (e) {
          failCount += 1
          const error = e as HLinkError
          if (error.isHlinkError) {
            if (error.reason && error.ignore) {
              if (failReasons[error.reason]) {
                failReasons[error.reason].push(error.filepath)
              } else {
                failReasons[error.reason] = [error.filepath]
              }
            } else {
              throw error
            }
          } else {
            log.error('未知错误, 请完整截图咨询!')
            log.error(error)
            throw error
          }
        }
        bar.tick(1, {
          file: chalk.gray(
            getDirBasePath(pathObj.originalSource, pathObj.sourcePath)
          ),
        })
      },
    })
  }
  endLog(successCount, failCount, failReasons)
  time.end()
  // 只有openCache才进行存储
  if (openCache) {
    saveCache(waitLinkFiles.map((a) => a.sourcePath))
  }
  return {
    waitLinkFiles,
    failCount,
    successCount,
    failReasons,
  }
}

// 新增守护进程逻辑
async function hlinkDaemon(options: IOptions) {
  const watchInterval = options.watchInterval || 10000 // 10秒检查一次
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await hlink(options)

    // 添加监测逻辑
    if (result.waitLinkFiles.length > 0) {
      log.info('检测到待处理文件，自动执行中...')
    } else {
      log.info(
        `无待处理文件，持续监测中...（每${watchInterval / 1000}秒检查一次）`
      )
      // 添加10秒间隔检查
      await new Promise((resolve) => setTimeout(resolve, watchInterval))
    }
  }
}

export default hlinkDaemon
