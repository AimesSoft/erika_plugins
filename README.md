# Erika 插件

Erika 的官方插件仓库。Erika 的「设置 › 插件」里的插件市场读的就是这里的 [`plugins.json`](plugins.json)，打开开关就能用的小功能都在这里：每个插件一个文件夹，脚本、声明、图标和说明放在一起。

插件用 JavaScript 编写，只能调用它在 `pack.json` 里声明过的权限，市场按权限给它打标签。接口与 NipaPlay 的 JS 插件一致，NipaPlay 的单个 `.js` 插件 Erika 也能直接装。

## 这里的插件

| 插件 | 分类 | 做什么 |
| --- | --- | --- |
| [自动弹幕偏移](plugins/erika.auto_danmaku_offset) | 弹幕 | 认出网飞片头，量出片头后的黑场在哪里结束，把弹幕延后到正片开始的时刻 |
| [AI 防剧透](plugins/erika.spoiler_ai) | 弹幕 | 把弹幕交给你配置的 AI（OpenAI 兼容接口或 Gemini），屏蔽它认为剧透的 |
| [更多弹幕颜色](plugins/erika.danmaku_colors) | 弹幕 | 发送弹幕时多出 NipaPlay 的其余九种颜色 |
| [十六进制弹幕颜色](plugins/erika.danmaku_hex_color) | 弹幕 | 发送弹幕时可以输入 `#RRGGBB` |
| [倍速扩展](plugins/erika.speed_range) | 工具 | 倍速扩展到 0.25× 至 5× |
| [手动标记已看](plugins/erika.episode_watched) | 工具 | 番剧详情里每一集右上角的「标记已看」，登录了账号时同步 |
| [下载快速选择](plugins/erika.download_quick_select) | 工具 | 添加下载时快速选择以前用过的文件夹和对应番剧的文件夹 |

每个插件文件夹里的 `README.md` 写着它的功能、设置、权限与更新日志，Erika 的插件详情页显示的就是它。

## 安装

- **插件市场**：在 Erika 的「设置 › 插件 › 市场」里点「获取」。市场从这个仓库的 `main` 分支读取，插件更新后显示「更新」。
- **插件包**：单独分发的插件是 `.epk` 文件，在「设置 › 插件 › 已安装」里「导入文件」。
- **文件夹或 NipaPlay 脚本**：同一个地方「导入文件夹」，或者「导入文件」选 NipaPlay 的 `.js`。

## 开发与调试

把这个仓库克隆到 Erika 仓库旁边（与它同级），Erika 的调试版在构建时会把这里的插件编进程序，市场里直接列出它们（排在最前，同一个 id 以这里的为准），手机和电视上也能装；改了插件重新构建 Erika 就会更新。`ERIKA_LOCAL_PLUGINS` 可以指向别的插件文件夹，设成 `-` 则不带；正式版不带。

也可以让 Erika 直接读一份本地索引：

```sh
ERIKA_PLUGIN_INDEX=/path/to/erika_plugins/plugins.json
```

### 插件包（.epk）

仓库和市场里的插件都是文件夹；单独分发一个插件时用插件包。插件包是 zip：插件文件夹里的文件放在包的根上。Erika 导入时把它解压到数据目录的 `plugins/<id>/`，装好后仍是文件夹。导入时会检查 `pack.json` 和其中 `main` 指定的脚本，名字跳出文件夹的包、解压后超过 32 MB 的包都不会装。

```sh
python3 tools/pack.py                              # plugins.json 列出的每个插件，写到 dist/<id>.epk
python3 tools/pack.py plugins/erika.speed_range    # 只打这几个文件夹
```

### 图标

`tools/make_icon.swift` 用 SF Symbol 画这里各个插件的图标（需要 macOS）：

```sh
swift tools/make_icon.swift <SF Symbol> <#RRGGBB> plugins/<id>/icon.png
```

## 插件的格式

一个插件是一个文件夹，放三个文件（也可以有别的文件，插件包会一起带上）：

| 文件 | 作用 |
| --- | --- |
| `pack.json` | 声明：名字、简介、权限、分类、图标等 |
| `main.js`（名字由 `main` 指定） | 插件的脚本 |
| `icon.png` | 256 × 256 的图标，可以没有 |
| `README.md` | 插件详情页显示的说明 |

`pack.json`：

```json
{
  "id": "erika.speed_range",
  "name": "倍速扩展",
  "version": "1.0.0",
  "minHostVersion": "0.1.0",
  "description": "让倍速播放更灵活。",
  "author": "Erika",
  "category": "tools",
  "permissions": ["player.control"],
  "icon": "icon.png",
  "iconId": "speedometer",
  "main": "main.js",
  "priority": 50
}
```

- `minHostVersion` 是 **Erika** 的最低版本。
- `category` 只有四种：`danmaku`（弹幕）、`picture`（画面）、`tools`（工具）、`appearance`（外观）。
- `icon` 是文件夹里的 256 × 256 PNG。没有图标时用 `iconId` 指定一个系统图标，市场里显示成灰底图标；可用的有 `puzzlepiece.extension`、`eye.slash`、`line.3.horizontal.decrease`、`shield`、`tv`、`scissors`、`arrow.up.right.square`、`music.note`、`paintpalette`、`text.bubble`、`speedometer`、`link`、`arrow.down.circle`、`checkmark`、`sparkles`、`folder`、`film`、`star`、`gearshape`、`slider.horizontal.3`、`gobackward.10`。
- `priority` 小的先处理弹幕，默认 50。
- 市场按 `permissions` 给插件打标签。

和 NipaPlay 一样，声明也可以写在脚本里的 `pluginManifest`；Erika 暂时忽略 NipaPlay 插件的 `minHostVersion`（那是 NipaPlay 的版本号）。这里的插件用 `pack.json`，它优先于脚本里的声明。

## 脚本接口

与 NipaPlay 的 JS 插件接口一致（`pluginManifest`、`pluginBlockWords`、`pluginUIEntries`、`pluginHandleUIAction`、`pluginOnEvent`、生命周期函数，以及 `plugin`、`player`、`danmaku`、`ui`、`storage`、`dev`、`system`、`process`、`settings`），差别是：

- 插件运行在系统的 JavaScript 引擎里（有 WebView 的平台），tvOS 上是 Boa。脚本不能同步调用宿主：读取的东西（`player.getState()`、`settings.getText()`、`storage.get()`）来自宿主每次调用前给的快照；其余调用排队，在这次调用结束后执行。没有定时器。
- 和播放内核打交道的 `player`、`danmaku` 由 [liberika](https://github.com/AimesSoft/liberika) 提供（`erika_plugin`），别的播放器用 liberika 也能跑这些插件。`danmaku.checkSimilarity` 和 `pairSimilarity` 在脚本里直接算。
- `pluginBlockWords` 每次调用后都会重新读，可以随时改。
- `pluginHandleUIAction` 可以返回 Promise。
- `settings.getText(id, 默认值)`、`settings.getSwitch(id, 默认值)` 可以带默认值。
- 不支持 `danmaku.renderer`（WebView 弹幕渲染层）：Erika 的控件是系统原生的，没有地方放 WebView。

Erika 自己加的：

| 接口 | 权限 | 作用 |
| --- | --- | --- |
| `player.setRate(倍速)` | `player.control` | 以这个倍速播放 |
| `danmaku.setOffset(秒)`、`danmaku.getOffset()` | `danmaku.modify` | 弹幕偏移，正数是延后 |
| `net.fetch(url, { method, headers, body })` | `network` | 网络请求，返回 `{ status, ok, headers, body, json(), text() }` 的 Promise |
| `library.getShows()` | `library.read` | 媒体库里的番剧：`{ id, title, folders }` |
| `library.setEpisodeWatched(番剧, 集, 已看)` | `library.write` | 标记某一集看过没有，登录了账号时同步 |
| `extend.speeds([倍速…])` | `player.control` | 倍速菜单多出这些倍速 |
| `extend.danmakuColors([{ name, color }])` | `danmaku.modify` | 发送弹幕时多出这些颜色（`#RRGGBB`） |
| `extend.danmakuHexInput(true)` | `danmaku.modify` | 发送弹幕的气泡里多一个十六进制颜色输入框 |
| `extend.episodeWatchedButton(true)` | `library.write` | 番剧详情的每一集右上角显示「标记已看」 |
| `extend.downloadQuickSelect(true)` | `library.read` | 添加下载时显示「快速选择」；`pluginDownloadSuggestions({ name })` 返回 `[{ title, folder }]` |
| `extend.openingProfile(true, seconds)` | `player.control` | 打开视频时量开头 `seconds` 秒（默认 10，最多 60），发 `openingProfiled` 事件 |

`extend` 加的东西只在插件运行时有效，关掉插件就没了。

事件（`pluginOnEvent`）：`videoLoaded`、`play`、`pause`、`seek`、`danmakuLoaded`，以及 Erika 的 `openingProfiled`（`{ url, frames: [{ time, red, green, blue, luma, dark, white, red_share }] }`）。

## 提交插件

1. 在 `plugins/` 下新建一个以插件 id 命名的文件夹，放 `pack.json`、脚本、`icon.png` 与 `README.md`（功能、设置、权限、更新日志）。
2. 在 `plugins.json` 的 `plugins` 里加一项：内容与 `pack.json` 相同，另加 `"path": "plugins/<id>"`。
3. 更新插件时同时改 `pack.json` 与 `plugins.json` 里的 `version`，并在插件的 `README.md` 里写一条更新日志。
4. 用调试版 Erika 或 `ERIKA_PLUGIN_INDEX` 装上试过，再提交 Pull Request。

## 许可证

[MIT](LICENSE)
