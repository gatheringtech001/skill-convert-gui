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
