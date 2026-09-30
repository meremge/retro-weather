// build.js（完全汎用型・全ルートプロキシ自動化版）
const fs = require('fs');
const path = require('path');

const srcHtmlPath = path.join(__dirname, 'RETRO_WEATHER.html');

if (!fs.existsSync(srcHtmlPath)) {
  console.error(`Error: ${srcHtmlPath} が見つかりません。`);
  process.exit(1);
}

const rawHtml = fs.readFileSync(srcHtmlPath, 'utf8');

// 1. <script> の中身（JS）をそのまま抽出
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
  // ■ 1. 読み込まれた瞬間に埋め込み script タグとパラメータを確定
  const realCurrentScript = document.currentScript || (function() {
    const scripts = document.querySelectorAll('script[src*="weather_widget.js"], script[src*="widget.js"]');
    return scripts.length > 0 ? scripts[scripts.length - 1] : null;
  })();

  const rawSrc = realCurrentScript ? realCurrentScript.src : '';
  const queryString = rawSrc.includes('?') ? rawSrc.split('?')[1] : '';

  if (!document.querySelector("link[href*='DotGothic16']")) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=DotGothic16&display=swap";
    document.head.appendChild(fontLink);
  }

  const htmlContent = ${JSON.stringify(cleanHtml)};
  const jsContent = ${JSON.stringify(extractedJs)};

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

        // ■ 2. 抽出JS実行時、どの口から探してもパラメータが拾える「環境シミュレータ」を構築
        const runWrappedJs = new Function(
          'queryString',
          'realScript',
          \`
          // Route A: document.currentScript を偽装復元
          try {
            Object.defineProperty(document, 'currentScript', {
              get: () => realScript,
              configurable: true
            });
          } catch(e) {}

          // Route B: window.location.search が空なら埋め込みパラメータを模倣
          if (queryString && (!window.location.search || window.location.search === '')) {
            try {
              Object.defineProperty(window.location, 'search', {
                get: () => '?' + queryString,
                configurable: true
              });
            } catch(e) {}
          }

          // Route C: 抽出された元の JavaScript を実行
          \${jsContent}
          \`
        );

        runWrappedJs(queryString, realCurrentScript);

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

console.log('✨ [Success] 完全汎用ビルド完了！');
