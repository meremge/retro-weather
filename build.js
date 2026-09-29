// build.js（全自動・分離型ビルド）
const fs = require('fs');
const path = require('path');

const srcHtmlPath = path.join(__dirname, 'RETRO_WEATHER.html');

if (!fs.existsSync(srcHtmlPath)) {
  console.error(`Error: ${srcHtmlPath} が見つかりません。`);
  process.exit(1);
}

const rawHtml = fs.readFileSync(srcHtmlPath, 'utf8');

// 1. <script> タグの中身（JSロジック）を抽出
const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
let extractedJs = '';
let match;

while ((match = scriptRegex.exec(rawHtml)) !== null) {
  extractedJs += match[1] + '\n';
}

// 2. <script> を除いた純粋な HTML/CSS（フォントや<style>を含む見た目全体）
const cleanHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

// 3. ウィジェットテンプレート（HTML/CSSはShadow DOMへ、JSはグローバルへ）
const widgetTemplate = `(function() {
  const htmlContent = ${JSON.stringify(cleanHtml)};
  const jsContent = ${JSON.stringify(extractedJs)};

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // 1. 見た目（HTML・CSS・フォント）を Shadow DOM に注入
      this.shadowRoot.innerHTML = htmlContent;

      // 2. Shadow DOM 内の全要素を文書ドキュメント(body)側へ安全に開帳・展開（JSからのDOM参照を有効化）
      const template = document.createElement('template');
      template.innerHTML = htmlContent;
      
      // まだ画面に未追加の場合のみ追加
      if (!document.getElementById('retro-weather-dom-container')) {
        const domContainer = document.createElement('div');
        domContainer.id = 'retro-weather-dom-container';
        domContainer.style.display = 'contents';
        
        // シャドウ内のDOM構造を直接操作できるように展開
        while (this.shadowRoot.firstChild) {
          domContainer.appendChild(this.shadowRoot.firstChild.cloneNode(true));
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
      }
    }
  }

  if (!customElements.get('retro-weather-widget')) {
    customElements.define('retro-weather-widget', RetroWeatherWidget);
  }

  // グローバル空間で JS ロジックを実行（document.getElementById がそのまま動作）
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

    // 抽出された JavaScript ロジックを実行
    try {
      const scriptEl = document.createElement('script');
      scriptEl.textContent = jsContent;
      document.body.appendChild(scriptEl);
    } catch (e) {
      console.error('RetroWeather Widget JS Execution Error:', e);
    }
  });
})();`;

// 成果物の書き出し
fs.writeFileSync(path.join(__dirname, 'widget.js'), widgetTemplate, 'utf8');
fs.writeFileSync(path.join(__dirname, 'weather_widget.js'), widgetTemplate, 'utf8');

console.log('✨ [Success] HTML/CSSとJSを分離した超軽量ウィジェットのビルドが完了しました！');
