// build.js（無限ループ完全防止・安全版）
const fs = require('fs');
const path = require('path');

const srcHtmlPath = path.join(__dirname, 'RETRO_WEATHER.html');

if (!fs.existsSync(srcHtmlPath)) {
  console.error(`Error: ${srcHtmlPath} が見つかりません。`);
  process.exit(1);
}

const rawHtml = fs.readFileSync(srcHtmlPath, 'utf8');

// 1. <script> の中身（JS）を抽出
const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
let extractedJs = '';
let match;

while ((match = scriptRegex.exec(rawHtml)) !== null) {
  extractedJs += match[1] + '\n';
}

// 2. <script> を除いた純粋な HTML/CSS
const cleanHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

// 3. ウィジェットテンプレート
const widgetTemplate = `(function() {
  const htmlContent = ${JSON.stringify(cleanHtml)};
  const jsContent = ${JSON.stringify(extractedJs)};

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // 1. 見た目（HTML/CSS）を Shadow DOM に一度だけ注入
      if (!this.shadowRoot.innerHTML) {
        this.shadowRoot.innerHTML = htmlContent;
      }
    }
  }

  if (!customElements.get('retro-weather-widget')) {
    customElements.define('retro-weather-widget', RetroWeatherWidget);
  }

  // 2. ページ読み込み完了時に一度だけ画面へ追加し、JSを実行
  const initWidget = () => {
    let container = document.getElementById('retro-weather-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'retro-weather-widget';
      document.body.appendChild(container);
    }
    
    if (container.children.length === 0) {
      container.appendChild(document.createElement('retro-weather-widget'));
    }

    // JSロジックを一度だけ実行
    if (!window.__retro_weather_initialized) {
      window.__retro_weather_initialized = true;
      try {
        const runJs = new Function(jsContent);
        runJs();
      } catch (e) {
        console.error('RetroWeather Widget JS Execution Error:', e);
      }
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();`;

// 成果物の書き出し
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] 無限ループ防止版 widget.js を生成しました！');
