// build.js（全自動抽出版 + 枠外背景排除・緑枠ピッタリ収まり対応）
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

// 2. <script> を取り除いた「純粋な HTML + CSS」
let cleanHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

// 3. body スタイルを :host に読み替えつつ、外側の全幅広がり＆余剰背景をカット
cleanHtml = cleanHtml.replace(/(^|\}|\s)body([\s,\{\.\#])/gi, '$1:host$2');

const scopeFixRule = `<style>
  @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
  
  /* 最外層（:host）の全幅背景ハミ出しを完全抑制 */
  :host {
    display: inline-block !important;
    background: transparent !important;
    width: auto !important;
    max-width: 100%;
    box-sizing: border-box;
  }

  :host, * {
    font-family: 'DotGothic16', sans-serif !important;
    box-sizing: border-box;
  }
</style>`;

cleanHtml = scopeFixRule + cleanHtml;

// 4. ウィジェット配信スクリプトの組み立て
const widgetTemplate = `(function() {
  // DotGothic16 フォントを親ページの head へ自動注入
  if (!document.querySelector("link[href*='DotGothic16']")) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=DotGothic16&display=swap";
    document.head.appendChild(fontLink);
  }

  const htmlContent = ${JSON.stringify(cleanHtml)};
  const jsContent = ${JSON.stringify(extractedJs)};

  // 見た目（HTML/CSS）だけを Shadow DOM 化するカスタム要素
  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      if (!this.shadowRoot.innerHTML) {
        this.shadowRoot.innerHTML = htmlContent;
      }
    }
  }

  if (!customElements.get('retro-weather-widget')) {
    customElements.define('retro-weather-widget', RetroWeatherWidget);
  }

  // 画面への挿入 ＆ JS のグローバル実行
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

    // JSロジックを一度だけグローバル空間で実行
    if (!window.__retro_weather_initialized) {
      window.__retro_weather_initialized = true;
      try {
        const widgetEl = container.querySelector('retro-weather-widget');
        const sr = widgetEl ? widgetEl.shadowRoot : null;
        
        if (sr) {
          const originalGetId = document.getElementById.bind(document);
          document.getElementById = function(id) {
            return sr.getElementById(id) || originalGetId(id);
          };
        }

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

// ファイル出力
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] 全コード保持・緑枠フィット修正版 widget.js を生成しました！');
