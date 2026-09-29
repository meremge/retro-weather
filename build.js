// build.js（JavaScript自動抽出・実行対応版）
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

// 2. <script> タグを除去した純粋な HTML/CSS
const cleanHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

// 3. ウィジェットテンプレート（Shadow DOM 内で抽出した JS を安全に実行）
const widgetTemplate = `(function() {
  const htmlContent = ${JSON.stringify(cleanHtml)};
  const jsContent = ${JSON.stringify(extractedJs)};

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // HTML/CSS を Shadow DOM 内に挿入
      this.shadowRoot.innerHTML = htmlContent;

      // 抽出した JavaScript を shadowRoot のコンテキストで実行
      try {
        const sr = this.shadowRoot;
        const runWidgetLogic = new Function('shadowRoot', 'sr', 'document', jsContent);
        // Shadow DOM 内の document 参照を shadowRoot にバインドして実行
        runWidgetLogic(sr, sr, sr);
      } catch (e) {
        console.error('Widget Script Execution Error:', e);
      }
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

// 4. 成果物の書き出し
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] JS自動分離・実行に対応した widget.js / weather_widget.js を生成しました！');
