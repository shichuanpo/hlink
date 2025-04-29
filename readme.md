<p align="center">
  <a href="https://hlink.likun.me" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://hlink.likun.me/logo.svg" alt="hlink logo">
  </a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/hlink"><img src="https://img.shields.io/npm/v/hlink.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/hlink.svg" alt="node compatibility"></a>
  <a href="https://npmjs.com/package/hlink"><img src="https://img.shields.io/npm/dm/hlink.svg" alt="downloads"></a>
  <a href="https://github.com/likun7981/hlink/actions/workflows/publish.yml"><img src="https://github.com/likun7981/hlink/actions/workflows/publish.yml/badge.svg" alt="license"></a>
  <a href="https://github.com/likun7981/hlink/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/hlink.svg" alt="license"></a>
</p>

# hlink

> 批量、快速硬链工具(The batch, fast hard link toolkit)

- 💡 重复检测：支持文件名变更的重复检测
- ⚡️ 快速：`20000+`文件只需要 1 分钟
- 📦 多平台：支持 Windows、Mac、Linux
- 🛠️ 丰富的配置：支持黑白名单，缓存等多个配置
- 🔩 修剪机制：让你更方便的同步源文件和硬链
- 🌐 WebUI：图形化界面让你更方便的管理
- 🐳 Docker：无需关心环境问题

更多介绍：https://hlink.likun.me

## 本地修改

由于不支持源文件硬链到多个目标目录（pathsMapping 为对象），所以本地修改为 pathsArray。
其中 packages/cli/hlink.config.mjs 已修改。

另外，由于 git 会频繁变动文件，且怀疑 ​​Git 更新文件时替换了 inode 导致硬链失效，所以新增了轮询监测逻辑，新添加配置文件 watchInterval，默认为 10000 毫秒，即 10 秒。

## 本地执行

1. clone 项目并且本地打包

```bash
  git clone 项目地址 // 或者 fork 后 clone 自己的仓库
  cd hlink
  pnpm i
  pnpm run build
```

2. 修改 hlink.config.js 配置文件中 pathsArray 配置项改为自己的项目地址

```bash
{
  /**
   * 源路径与目标路径的映射关系
   */
  pathsArray: [
    {
      source: '用你自己的项目地址替换',
      target: '用你自己的项目地址替换',
    }
  ],
  /**
   * 需要包含的后缀，如果与exclude同时配置，则取两者的交集
   *
   * 后缀不够用? 高阶用法: todo 待补充链接
   */
  include: '**',
  /**
   * 需要排除的后缀，如果与include同时配置，则取两者的交集
   *
   * 后缀不够用? 高阶用法: todo 待补充链接
   */
  exclude: [],
  /**
   * 是否保持原有目录结构，为false时则只保存一级目录结构
   * 可选值: true/false
   * 例子：
   *  - 源地址目录为：/a
   *  - 目标地址目录为: /d
   *  - 链接的文件地址为 /a/b/c/z/y/mv.mkv；
   *  如果设置为true  生成的硬链地址为: /d/b/c/z/y/mv.mkv
   *  如果设置为false 生成的硬链地址为：/d/y/mv.mkv
   */
  keepDirStruct: true,
  /**
   * 是否打开缓存，为true表示打开
   * 可选值: true/false
   * 打开后，每次硬链后会把对应文件存入缓存，就算下次删除硬链，也不会进行硬链
   */
  openCache: false,
  /**
   * 是否为独立文件创建同名文件夹，为true表示创建
   * 可选值: true/false
   */
  mkdirIfSingle: false,
  watchInterval: 10000,
}
```

3. 执行硬链操作

```bash
  node packages/cli/lib/cli.js hlink.config.js
```
