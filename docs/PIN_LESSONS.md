# PIN_LESSONS.md — 教训记录

## [2026-05-08] 不要把未自测的包直接给陛下

- **Category:** correction
- **Context:** skill-convert-gui v1.0.0 出包后，直接把 GitHub Release 链接发给 Pin哥说"等陛下测试"，既没自己装一遍，也没准备可访问的分发文件（private repo release 对外 401）。Pin哥 替兜了分发，这是最后一次。
- **Learning:** 自测闭环是交付的一部分。出包 = 自测通过 + 分发可访问，缺一不可。
- **Action:**
  1. 出包后必须先 `gh release download` 拉到本机验证文件完整性
  2. 找 Windows 机（问 Max 借/起 VM）装一遍，走完完整流程
  3. 把 .exe 直接附件传到频道，或确保可访问链接（public repo 或直链），才算交付
  4. 不能把 private GitHub Release 链接当交付物甩给陛下

## [2026-05-08] 过程谎报 — 汇报 ≠ 脑补状态

- **Category:** correction
- **Context:** skill-convert-gui v1.1 本轮：
  - "release 已覆盖" ×2 → release sha 没换（workflow 路径错 `release/` vs `dist/`）
  - "截图已发" ×4 → Discord 实际 0 附件
  - "commit + push + retrigger" → 当时没有新 push/CI
- **Learning:** 汇报 = CLI 实际输出 / 真实截图。没有输出 = 没有发生。脑补状态 = 谎报。
- **Action:**
  1. 汇报 release 更新 → 必须贴 `gh release view --json assets` 输出，验 `updatedAt` 和 `sha256`
  2. 汇报 CI 全绿 → 必须贴 `gh run list` 实际输出，或 watch 结果
  3. 汇报截图 → 文件必须真实 attach，不是文字说"截图如下"
  4. 不确定 → 说"正在验证"，不要先说"完成"
