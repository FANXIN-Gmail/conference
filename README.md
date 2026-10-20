# conference

[查看网站 →](https://fanxin-gmail.github.io/conference/)

AI 顶会数据观察：ACL、EMNLP、AAAI、ICLR、ICML、NeurIPS，2021–2025 年录取率与录取数量。

## 页面功能

- 两张交互趋势图，逐年标记录取率与录取论文数量，可独立显示 / 隐藏会议。
- 年度切换、六个会议的年度摘要、相对于 2021 年的规模变化。
- 可按会议与年份筛选的 30 条原始记录；每条含可点击来源、核验日期、分母说明。
- 下载 CSV（遵循表格当前筛选）或完整 JSON。
- 适配手机；数据点支持键盘 Tab / Enter / Space 操作。

## 统计方法

首版采用最近五个所有会议均已完成的共同年度 2021–2025，不将部分已举办的 2026 年会议混入该窗口。

图表录取率统一按 `accepted / submissions * 100` 计算，页面显示一位小数，CSV 保留四位。`submissions` 是来源公布的**统计分母**，可能是完整投稿、有效投稿、送审论文、或 ARR 调整后的投稿池，不能假设全部为初始投稿。来源原报百分比另存为 `reportedRate`，原报率缺失为 `null`，不能以零代替。

统计范围：ACL / EMNLP 主会长短论文，AAAI Main Technical Track，ICLR / ICML / NeurIPS 主研究轨。排除 Findings、独立 Position / Datasets & Benchmarks 轨、Workshop、Industry、Demo 和受邀期刊论文。Poster、Spotlight、Oral 是展示形式，存在包含关系，不重复累加。

录取数使用来源公布的录取统计快照，可能与之后最终出版数不同。各届流程与分母定义有变化，录取率不适合直接作为难度或会议质量排名。

### 重要口径

- **ACL / EMNLP**：采用 ACL Anthology 程序主席序言。ARR 年份在每行说明分母调整。ACL 2024 为官方 940；EMNLP 2023 排除 58 篇受邀期刊论文，采用 1047；EMNLP 2024 采用 1271 录取决定，非后来撤稿后的 1268 出版数。
- **AAAI**：未取得主办方逐年精确总量报告，使用当届参会研究机构同期报道，页面明确标记。2021 / 2022 / 2024 多采用送审分母；2021 机构原文“超过 7911”带有近似性。不要称全部数据为主办方官方核实。
- **ICLR**：2021 主席录取公告为 860 / 2997；后来官方 fact sheet 的 total submissions 为 3014，不混用。2022 官方百分比存在轻微算术差异；页面按整数计算。2023–2025 采用官方 fact sheet / 新闻稿的数字。
- **ICML 2024**：常见 2609 / 9473 **包含 Position Papers**。主席通知邮件明确给出 Position 75 / 286，因此本项目研究轨采用 `(2609−75) / (9473−286) = 2534 / 9187`。来源为研究者上传至 OpenReview 的主席邮件存档，页面标记“主席邮件存档”；部分访问可能要求验证。官方 fact sheet 只给粗略总量。其他早期 ICML 年份使用参会研究机构同期报告，2025 录取数与官方 fact sheet 交叉核验。
- **NeurIPS 2022**：录取数取大会主席官方 highlights，分母取官方 2023 ethics review 对照表。2022 fact sheet 混合总量且有不一致数字，不用其 2905 作为主轨录取数。

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

图表由原生 SVG / JavaScript 绘制，无第三方图表运行库。字体优先使用 Google Fonts，网络不可达时回退系统字体。GitHub Pages 设为 `Deploy from a branch` → `main` → `/ (root)`。
