(function() {
  var container = document.getElementById('retro-weather-container') || document.currentScript.parentNode;
  var wrapper = document.createElement('div');
  wrapper.className = 'retro-weather-wrapper';
  wrapper.innerHTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- スマホブラウザのアドレスバー・ヘッダー色設定 -->
  <meta name="theme-color" content="#1a1a2e">
  <title>一生死なない！レトロお天気＆気圧ウィジェット</title>
  <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #1a1a2e;
      color: #00ffcc;
      font-family: 'DotGothic16', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start; /* 中央寄せから「上寄せ」に変更 */
      min-height: 100vh;
      margin: 0;
      padding: 20px 10px 30px 10px; /* 上部余白を詰めてスッキリ配置 */
      box-sizing: border-box;
    }

    /* --- モーダル表示時に背景スクロールを完璧にロック --- */
    body.modal-open {
      overflow: hidden !important;
    }

    .widget-card {
      border: 4px solid #00ffcc;
      padding: 18px;
      width: 310px;
      background-color: #0f0f1b;
      box-shadow: 6px 6px 0px #ff0055;
      text-align: center;
      border-radius: 4px;
      box-sizing: border-box;
      position: relative;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    /* --- 共有ボタン (3点共有アイコン) --- */
    .share-btn-img {
      background: transparent;
      border: 2px solid #00ffcc;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      box-sizing: border-box;
      overflow: hidden;
      flex-shrink: 0;
    }
    .share-btn-img:hover {
      background: #00ffcc;
    }
    .share-btn-img:hover .share-svg-icon {
      fill: #000;
    }

    /* どこでも崩れないインラインSVGアイコン */
    .share-svg-icon {
      width: 16px;
      height: 16px;
      fill: #00ffcc;
      display: block;
    }

    .location-controls {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
      position: relative;
    }

    /* --- カスタムプルダウン --- */
    .custom-select-wrapper {
      flex-grow: 1;
      position: relative;
      text-align: left;
    }

    .custom-select-trigger {
      background: #0f0f1b;
      color: #00ffcc;
      border: 2px solid #00ffcc;
      padding: 5px 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .custom-options {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #0f0f1b;
      border: 2px solid #00ffcc;
      border-top: none;
      z-index: 100;
      max-height: 180px;
      overflow-y: auto;
      box-shadow: 4px 4px 0px #000;
    }

    .custom-options.open {
      display: block;
    }

    .custom-option {
      padding: 6px 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px dashed #1a3a4b;
    }

    .custom-option:hover {
      background: #1a2a3a;
      color: #ffff00;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .delete-item-btn {
      color: #ff0055;
      border: 1px solid #ff0055;
      background: transparent;
      cursor: pointer;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      line-height: 1;
      padding: 0;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .delete-item-btn:hover {
      background: #ff0055;
      color: #fff;
    }

    /* --- 検索入力欄 ＆ クリア（×）ボタン --- */
    .search-box {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
    }

    .input-wrapper {
      position: relative;
      flex-grow: 1;
      display: flex;
      align-items: center;
    }

    .input-wrapper input {
      width: 100%;
      padding-right: 22px;
      box-sizing: border-box;
    }

    .clear-input-btn {
      position: absolute;
      right: 4px;
      background: transparent;
      border: none;
      color: #ff0055;
      font-size: 14px;
      cursor: pointer;
      padding: 0 4px;
      display: none;
      line-height: 1;
    }
    .clear-input-btn:hover {
      color: #ffff00;
    }

    input, button {
      background: #0f0f1b;
      color: #00ffcc;
      border: 2px solid #00ffcc;
      padding: 5px;
      font-family: inherit;
      cursor: pointer;
      font-size: 13px;
    }

    input {
      color: #ffff00;
      cursor: text;
    }

    button:hover { background: #00ffcc; color: #000; }

    .weather-display { margin: 10px 0; }

    .weather-icon-box {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
    }

    .pixel-icon {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    .weather-icon-box img {
      width: 64px;
      height: 64px;
    }

    .loading-icon {
      width: 48px;
      height: 48px;
    }

    .status-icon {
      width: 18px;
      height: 18px;
      vertical-align: middle;
      margin-right: 4px;
    }

    .detail-icon, .option-icon, .btn-icon {
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }

    .temp-display {
      font-size: 28px;
      color: #ffff00;
      margin: 2px 0;
    }

    .barometer-box {
      margin-top: 12px;
      padding: 8px;
      border: 2px dashed #ff0055;
      background-color: #2a081d;
    }

    .alert-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 5px;
      font-size: 13px;
      line-height: 1.3;
    }

    .details {
      font-size: 13px;
      margin-top: 10px;
      color: #888ff0;
      text-align: left;
      line-height: 1.8;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* --- 埋め込みコードボタン --- */
    .embed-footer {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #1a3a4b;
    }
    .embed-btn-square {
      width: 100%;
      background: #0f0f1b;
      color: #888ff0;
      border: 2px solid #888ff0;
      padding: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.1s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .embed-btn-square:hover {
      background: #888ff0;
      color: #000;
    }

    /* --- モーダルダイアログ --- */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 15px;
      box-sizing: border-box;
    }
    .modal-card {
      background: #0f0f1b;
      border: 3px solid #00ffcc;
      box-shadow: 6px 6px 0px #ff0055;
      padding: 16px;
      max-width: 340px;
      width: 100%;
      text-align: left;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .modal-title {
      color: #ffff00;
      font-size: 14px;
      margin-top: 0;
      margin-bottom: 10px;
      border-bottom: 2px dashed #00ffcc;
      padding-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .modal-desc {
      font-size: 11px;
      color: #00ffcc;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    .modal-notice {
      font-size: 11px;
      color: #ff88a3;
      line-height: 1.4;
      margin-bottom: 10px;
      background: #2a081d;
      padding: 6px;
      border: 1px dashed #ff0055;
    }
    .code-textarea {
      width: 100%;
      height: 60px;
      background: #1a1a2e;
      color: #ffff00;
      border: 1px solid #00ffcc;
      font-family: monospace;
      font-size: 11px;
      padding: 6px;
      box-sizing: border-box;
      resize: none;
      margin-bottom: 10px;
    }
    .modal-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .modal-actions button {
      font-size: 11px;
      padding: 5px 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .modal-actions button:hover .share-svg-icon {
      fill: #000;
    }
  </style>
</head>
<body>

  <div class="widget-card">
    <div class="header-bar">
      <span style="font-size: 11px; color: #ff0055;">[ RETRO_WEATHER_v3.3 ]</span>
      <button id="shareBtn" class="share-btn-img" title="お天気メモとして保存・共有">
        <svg class="share-svg-icon" viewBox="0 0 24 24">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77l-7.13-4.15c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
      </button>
    </div>
    
    <!-- プルダウン ＆ GPSボタン -->
    <div class="location-controls">
      <div class="custom-select-wrapper">
        <div id="selectTrigger" class="custom-select-trigger">
          <span id="selectedText">選択中...</span>
          <span>▼</span>
        </div>
        <div id="selectOptions" class="custom-options"></div>
      </div>
      <button id="gpsBtn" title="GPSで現在地を取得">GPS</button>
    </div>

    <!-- 検索 ＆ クリア（×）ボタン -->
    <div class="search-box">
      <div class="input-wrapper">
        <input type="text" id="searchInput" placeholder="例: 東京タワー, 秩父, 飯能">
        <button id="clearInputBtn" class="clear-input-btn" title="入力内容をクリア">×</button>
      </div>
      <button id="searchBtn">追加</button>
    </div>

    <!-- メイン表示 -->
    <div class="weather-display">
      <div id="displayLocationName" style="font-size: 13px; color: #ffff00; margin-bottom: 4px;">---</div>
      <div class="weather-icon-box">
        <img id="weatherImg" class="pixel-icon" src="" alt="天気" style="display:none;">
        <img id="loadingImg" class="pixel-icon loading-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/23f3.png" alt="読み込み中">
      </div>
      <div id="weatherTelop" style="font-size: 17px;">データ取得中...</div>
      <div id="tempDisplay" class="temp-display">-- ℃</div>
    </div>

    <!-- 気圧アラート -->
    <div class="barometer-box">
      <div>現地気圧: <span id="pressureDisplay">--</span> hPa</div>
      <div class="alert-container">
        <img id="pressureIcon" class="pixel-icon status-icon" src="" alt="気圧状態" style="display:none;">
        <span id="pressureAlert">チェック中...</span>
      </div>
    </div>

    <!-- 詳細 -->
    <div class="details">
      <div class="detail-item">
        <img class="pixel-icon detail-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4a8.png" alt="風">
        風速: <span id="windSpeed">--</span> m/s
      </div>
      <div class="detail-item">
        <img class="pixel-icon detail-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f506.png" alt="UV">
        UV指数: <span id="uvIndex">--</span>
      </div>
      <div class="detail-item">
        <img class="pixel-icon detail-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f332.png" alt="花粉">
        スギ花粉: <span id="pollenIndex">--</span>
      </div>
    </div>

    <!-- 埋め込みコードボタン -->
    <div class="embed-footer">
      <button id="openEmbedModal" class="embed-btn-square">
        <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2699.png" alt="設定">
        埋め込みコードを取得
      </button>
    </div>
  </div>

  <!-- 位置情報利用確認・GPSオフ警告モーダル (v3.0.6完全スタイル統合) -->
  <div id="initLocationModal" class="modal-overlay">
    <div class="modal-card">
      <h3 class="modal-title">
        <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4e1.png" alt="GPS">
        位置情報の利用確認
      </h3>
      <div id="initModalDesc" class="modal-desc">
        現在地のリアルタイムなお天気を取得しますか？<br>
        ※端末のGPS機能をオンにしてご利用ください。
      </div>
      <div id="initModalNotice" class="modal-notice" style="display: none;">
        ⚠️ GPSがオフか許可されていません。<br>端末の設定でGPSをオンにしてから再試行してください。
      </div>
      <div class="modal-actions">
        <button id="initGpsBtn">
          <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4cd.png" alt="ピン">
          <span id="initGpsBtnText">現在地を取得</span>
        </button>
        <button id="initCancelBtn" style="border-color: #ff0055; color: #ff0055;">デフォルト (東京)</button>
      </div>
    </div>
  </div>

  <!-- 埋め込みパーツ モーダル画面 -->
  <div id="embedModal" class="modal-overlay">
    <div class="modal-card">
      <h3 class="modal-title">
        <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f47e.png" alt="インベーダー">
        お天気埋め込みパーツ
      </h3>
      <div class="modal-desc">
        ご自身のブログやホームページ（WordPress、はてなブログ、Note、自作HPなど）に貼り付けると、選択中の場所のリアルタイムお天気を表示できます（※昔でいう「ブログパーツ」機能です）。
      </div>
      <div class="modal-notice">
        ※HTML対応のサイトでご利用いただけます。テキスト専用のSNS等では表示できません。<br>
        ※埋め込み表示内から詳細を操作した場合、本家アプリページが開きます。
      </div>
      <textarea id="embedCodeText" class="code-textarea" readonly></textarea>
      <div class="modal-actions">
        <button id="copyEmbedBtn">
          <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4cb.png" alt="クリップボード">
          コードコピー
        </button>
        <button id="shareEmbedBtn">
          <svg class="share-svg-icon" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77l-7.13-4.15c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
          アプリで共有
        </button>
        <button id="closeEmbedModal" style="border-color: #ff0055; color: #ff0055;">閉じる</button>
      </div>
    </div>
  </div>

<!-- FC2, inc.-->
<img src="//media.fc2.com/counter_img.php?id=50" style="display:none" alt="inserted by FC2 system" width="0" height="0">
<!-- FC2, inc.--></body>
</html>
  `;
  container.appendChild(wrapper);

  // 埋め込まれたスクリプトタグを直接取り出して実行（お天気データの動的取得を有効化）
  var scripts = wrapper.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var newScript = document.createElement('script');
    if (scripts[i].src) {
      newScript.src = scripts[i].src;
    } else {
      newScript.textContent = scripts[i].textContent;
    }
    document.body.appendChild(newScript);
  }
})();
