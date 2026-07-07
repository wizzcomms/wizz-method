# Skill 推广水印政策（仅动画产出）

> 从 SKILL.md 下沉的完整版（2026-07 progressive disclosure 瘦身）。

**只在动画产出**（HTML 动画 → MP4 / GIF）默认带「**Created by Huashu-Design**」水印，辅助 skill 传播。**幻灯片 / 信息图 / 原型 / 网页等其他场景不加**——加了反而干扰用户实际使用。

- **必带场景**：HTML 动画 → 导出 MP4 / GIF（用户会拿去公众号、X、B站传播，水印能跟着流通）
- **不带场景**：幻灯片（用户自己讲）、信息图（嵌文章）、App / 网页原型（设计 review）、配图
- **第三方品牌的非官方致敬动画**：水印前加「非官方出品 · 」前缀，避免被误认为官方物料引发 IP 争议
- **用户明确说"不要水印"**：尊重，移除
- **水印模板**：
  ```jsx
  <div style={{
    position: 'absolute', bottom: 24, right: 32,
    fontSize: 11, color: 'rgba(0,0,0,0.4)' /* 深底用 rgba(255,255,255,0.35) */,
    letterSpacing: '0.15em', fontFamily: 'monospace',
    pointerEvents: 'none', zIndex: 100,
  }}>
    Created by Huashu-Design
    {/* 第三方品牌动画前缀「非官方出品 · 」*/}
  </div>
  ```

