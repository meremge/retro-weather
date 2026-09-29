// build.js（Shadow DOMスコープ完全補正版）
const fs = require('fs');
const path = require('path');

const srcHtmlPath = path.join(__dirname, 'RETRO_WEATHER.html');

if (!fs.existsSync(srcHtmlPath)) {
  console.error(`Error: ${srcHtmlPath} が見つかりません。`);
  process.exit(1);
}

const rawHtml = fs.readFileSync(srcHtmlPath, 'utf8');

// 1. HTMLから <script> の中身（JSロジック）を抽出
const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
let extractedJs = '';
let match;

while ((match = scriptRegex.exec(rawHtml)) !== null) {
  extractedJs += match[1] + '\n';
}

// 2. JS内の document. 参照を shadowRoot(sr) 参照に自動置換して範囲を閉じ込める
// (document.getElementById -> sr.getElementById 等)
const scopedJs = extractedJs
  .replace(/document\./g, 'sr.')
  .replace(/window\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]/g, 'setTimeout');

// 3. <script> タグを除去した純粋な HTML/CSS
const cleanHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

// 4. ウィジェットテンプレート
const widgetTemplate = `(function() {
  const htmlContent = ${JSON.stringify(cleanHtml)};
  const jsContent = ${JSON.stringify(scopedJs)};

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // HTML/CSS を Shadow DOM 内に挿入
      this.shadowRoot.innerHTML = htmlContent;

      const sr = this.shadowRoot;

      // DOMが構築された直後に抽出・スコープ補正したJSを実行
      setTimeout(() => {
        try {
          const runWidgetLogic = new Function('sr', 'shadowRoot', jsContent);
          runWidgetLogic(sr, sr);
        } catch (e) {
          console.error('Widget Script Execution Error:', e);
        }
      }, 0);
    }
  }

  if (!customElements.get('retro-weather-widget')) {
    customElements.define('retro-weather-widget', RetroWeatherWidget);
  }

  window.addEventListener('DOMContentLoaded', () => {
    let container = document.getElementById('retro-weather-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'retro-weather-widget';
      document.body.appendChild(container);
    }
    if (container.children.length === 0) {
      container.appendChild(document.createElement('retro-weather-widget'));
    }
  });
})();`;

// 成果物の書き出し
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] Shadow DOMスコープ補正済みの widget.js / weather_widget.js を生成しました！');
