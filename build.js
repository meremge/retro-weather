// build.js（リポジトリ直下に保存）
const fs = require('fs');
const path = require('path');

const srcHtmlPath = path.join(__dirname, 'RETRO_WEATHER.html');

// 1. FC2用メインHTMLの読み込み
if (!fs.existsSync(srcHtmlPath)) {
  console.error(`Error: ${srcHtmlPath} が見つかりません。`);
  process.exit(1);
}

const rawHtml = fs.readFileSync(srcHtmlPath, 'utf8');

// 2. JavaScriptテンプレート（Shadow DOMのカプセル化＆一括バインド）
const widgetTemplate = `(function() {
  const htmlContent = ${JSON.stringify(rawHtml)};

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // Shadow DOM 内に HTML/CSS をカプセル化（外部サイトのスタイル干渉を遮断）
      this.shadowRoot.innerHTML = htmlContent;

      // DOM初期化・イベントバインド処理
      this.initWidgetEvents();
    }

    initWidgetEvents() {
      const sr = this.shadowRoot;
      if (!sr) return;

      // 安全な要素取得例（要素がなくてもエラー落ちしない構造）
      const searchBtn = sr.getElementById('searchBtn');
      const searchInput = sr.getElementById('searchInput');

      if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
          const query = searchInput.value;
        });
      }
    }
  }

  if (!customElements.get('retro-weather-widget')) {
    customElements.define('retro-weather-widget', RetroWeatherWidget);
  }

  // ページ読み込み完了時に自動挿入
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

// 3. 成果物の書き出し（2つのファイル名に出力して互換性を完全維持）
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] widget.js および weather_widget.js が正常に自動生成されました！');
