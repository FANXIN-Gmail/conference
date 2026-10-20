# conference

[查看网站 →](https://fanxin-gmail.github.io/conference/)

AI 顶会数据观察：ACL、EMNLP、AAAI、ICLR、ICML、NeurIPS，2021–2026 年录取率与投稿数量。

## 页面功能

- 两张交互趋势图，逐年标记录取率与投稿论文数量，可独立显示 / 隐藏会议。
- 数据与来源默认折叠；展开后可按会议与年份筛选 36 条原始记录，每条含来源、核验日期和统计范围。
- 下载 CSV（遵循表格当前筛选）；仓库同时提供完整 JSON。
- 适配手机；数据点支持键盘 Tab / Enter / Space 操作。

## 统计方法

保留 2021–2025 五年历史数据，并补入截至 2026-10-20 已公布的六个会议 2026 年录取结果。2026 年尚未全部举办，部分数字来自录取决定公告或参会机构报道，不代表最终出版篇数。

页面和 CSV 展示录取率与投稿数量，录取数量仅保留在原始 JSON 中用于计算。投稿数量采用各届来源公布的统计口径，部分为有效投稿、送审数或 ARR 投稿池，并非统一的初始创建投稿总量；完整口径保留在 JSON 中以便追溯。

图表录取率统一按 `accepted / submissions * 100` 计算，页面显示一位小数，CSV 保留四位。`submissions` 是来源公布的**统计分母**，可能是完整投稿、有效投稿、送审论文、或 ARR 调整后的投稿池，不能假设全部为初始投稿。来源原报百分比另存为 `reportedRate`，原报率缺失为 `null`，不能以零代替。

统计范围：ACL / EMNLP 主会长短论文，AAAI Main Technical Track，ICLR / ICML / NeurIPS 主研究轨。排除 Findings、独立 Position / Datasets & Benchmarks 轨、Workshop、Industry、Demo 和受邀期刊论文。Poster、Spotlight、Oral 是展示形式，存在包含关系，不重复累加。

录取数使用来源公布的录取统计快照，可能与之后最终出版数不同。各届流程与分母定义有变化，录取率不适合直接作为难度或会议质量排名。

### 重要口径

- **ACL / EMNLP**：采用 ACL Anthology 程序主席序言。ARR 年份在每行说明分母调整。ACL 2024 为官方 940；EMNLP 2023 排除 58 篇受邀期刊论文，采用 1047；EMNLP 2024 采用 1271 录取决定，非后来撤稿后的 1268 出版数。
- **AAAI**：未取得主办方逐年精确总量报告，使用当届参会研究机构同期报道，页面明确标记。2021 / 2022 / 2024 多采用送审分母；2021 机构原文“超过 7911”带有近似性。不要称全部数据为主办方官方核实。
- **ICLR**：2021 主席录取公告为 860 / 2997；后来官方 fact sheet 的 total submissions 为 3014，不混用。2022 官方百分比存在轻微算术差异；页面按整数计算。2023–2025 采用官方 fact sheet / 新闻稿的数字。
- **ICML 2024**：常见 2609 / 9473 **包含 Position Papers**。主席通知邮件明确给出 Position 75 / 286，因此本项目研究轨采用 `(2609−75) / (9473−286) = 2534 / 9187`。来源为研究者上传至 OpenReview 的主席邮件存档，页面标记“主席邮件存档”；部分访问可能要求验证。官方 fact sheet 只给粗略总量。其他早期 ICML 年份使用参会研究机构同期报告，2025 录取数与官方 fact sheet 交叉核验。
- **NeurIPS 2022**：录取数取大会主席官方 highlights，分母取官方 2023 ethics review 对照表。2022 fact sheet 混合总量且有不一致数字，不用其 2905 作为主轨录取数。

### 2026 年来源说明

- **ACL**：正式主席序言 2296 主会录取，不采用早期通知或汇总站的其他快照。
- **EMNLP**：2719 录取决定，广东外语外贸大学与 KAIST 公告一致；未取得官方精确总量统计，标为机构报道核验，待正式报告复核。Findings 2533 不计入。
- **AAAI**：4167 主技术轨录取，采用 Paderborn / HNI 2026-01-19 参会报告；官方开幕报告仅给约17.5%，无精确计数。
- **ICLR**：5355 录取，采用程序主席 2026-03-31 官方回顾；后续 fact sheet 的5357为另一统计快照。
- **ICML**：6352 研究论文录取，采用官方录取结果公告，该公告将 Position 轨单独列出。后续官方 fact sheet 记载6552，原因未明确，不能推断为跨轨道合计；本项目保留通知时的决定快照。
- **NeurIPS**：7900 主轨录取，维也纳大学与 KAIST 9月参会报道一致；标为机构报道核验，待组织方正式报告复核。

数据最后人工核验：**2026-10-20**。完整来源逐条保存在 [data/conferences.json](data/conferences.json)。

## 更新数据

1. 修改 `data/conferences.json`。每条保留 `conference`、`year`、`accepted`、`submissions`、`reportedRate`、`scope`、`note`、`sources`、`verifiedAt`。
2. 优先使用官方程序主席报告、统计表、新闻稿；需要机构报道或原始通知存档时，分别标记 `institution` 或 `archive`，并说明证据的限制。`official` 不能用于普通汇总站。
3. 将核验日期更新到对应记录；同时更新顶层 `updatedAt`。新增会议时增加 `conferences` 元信息；新增完整年份时扩大 `window` 并补齐所有会议。
4. 运行 `node scripts/validate-data.mjs --write-csv` 生成可独立下载的 CSV，再运行 `node scripts/validate-data.mjs` 验证。检查 `node --check app.js`。
5. 提交并推送到 `main`。GitHub Pages 从 `main` 根目录自动发布，GitHub Actions 验证数据完整性、唯一性、来源字段及 CSV 一致性。

这是可持续维护的人工核验数据集，**未配置自动抓取或定期更新任务**。源站口径变化需要人工核对；不要无审查地用网页篇数覆盖历史录取决定数。

## 本地预览

无需安装依赖或构建。于仓库目录运行 `python3 -m http.server 8765`，访问 `http://localhost:8765`。请使用 HTTP 预览，直接双击 HTML 的 `file://` 模式会阻止浏览器读取 JSON。

图表由原生 SVG / JavaScript 绘制，无第三方图表运行库。使用系统字体，无外部字体请求。GitHub Pages 设为 `Deploy from a branch` → `main` → `/ (root)`。
