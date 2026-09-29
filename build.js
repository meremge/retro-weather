// build.js（仕様書準拠・超軽量全自動ビルド）
const fs = require('fs');
const path = require('path');

const srcHtmlPath = path.join(__dirname, 'RETRO_WEATHER.html');

if (!fs.existsSync(srcHtmlPath)) {
  console.error(`Error: ${srcHtmlPath} が見つかりません。`);
  process.exit(1);
}

// 1. HTML/CSS/JS が入ったファイルをそのまま軽量読み込み
const rawHtml = fs.readFileSync(srcHtmlPath, 'utf8');

// 2. 超シンプルなウィジェット生成テンプレート
const widgetTemplate = `(function() {
  const htmlContent = ${JSON.stringify(rawHtml)};

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // 見た目（HTML/CSS）を Shadow DOM 内にカプセル化
      this.shadowRoot.innerHTML = htmlContent;

      // DOM内の script タグを安全に順次起動させる軽量ロジック
      const scripts = this.shadowRoot.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
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

// 3. 成果物を書き出し（一発生成）
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] 仕様書通りの超軽量 widget.js / weather_widget.js を生成しました！');
