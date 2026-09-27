(function() {
  const ICON_GPS = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4e1.png";
  const ICON_PIN = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4cd.png";
  const ICON_SEARCH = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f50d.png";
  const STORAGE_KEY = 'retro_weather_custom_cities';
  const VISITED_KEY = 'retro_weather_visited';
  const GPS_ALLOWED_KEY = 'retro_weather_gps_allowed';

  // ユーザー名とリポジトリ名を設定済み
  const GITHUB_USERNAME = "meremge"; 
  const GITHUB_REPO = "retro-weather";

  const defaultPresets = [
    { name: "現在地", lat: 35.6895, lon: 139.6917, jmaFile: "130000", areaName: "東京地方", icon: ICON_GPS, isPreset: true, subName: "" },
    { name: "所沢", lat: 35.7994, lon: 139.4692, jmaFile: "110000", areaName: "南部", icon: ICON_PIN, isPreset: true },
    { name: "東京", lat: 35.6895, lon: 139.6917, jmaFile: "130000", areaName: "東京地方", icon: ICON_PIN, isPreset: true },
    { name: "大阪", lat: 34.6937, lon: 135.5023, jmaFile: "270000", areaName: "大阪府", icon: ICON_PIN, isPreset: true },
    { name: "札幌", lat: 43.0621, lon: 141.3544, jmaFile: "016000", areaName: "石狩地方", icon: ICON_PIN, isPreset: true }
  ];

  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      this.currentLocations = [...defaultPresets];
      this.selectedLocation = defaultPresets[2];
      this.currentFetchedData = { weather: "--", temp: "--", pressure: "--", wind: "--", uv: "--", pollen: "--" };
    }

    connectedCallback() {
      this.render();
      this.initElements();
      this.loadSavedLocations();
      this.checkUrlParams();
      this.renderCustomSelect();

      const hasVisited = localStorage.getItem(VISITED_KEY);
      const isGpsAllowed = localStorage.getItem(GPS_ALLOWED_KEY) === 'true';

      if (!hasVisited || !isGpsAllowed) {
        this.openInitModal();
        this.fetchWeatherData(this.selectedLocation);
      } else {
        this.executeGpsFetch(false);
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
          
          :host {
            display: block;
            font-family: 'DotGothic16', sans-serif;
            color: #00ffcc;
            width: 310px;
            margin: 0 auto;
          }

          * {
            box-sizing: border-box;
          }

          .widget-card {
            border: 4px solid #00ffcc;
            padding: 18px;
            width: 310px;
            background-color: #0f0f1b;
            box-shadow: 6px 6px 0px #ff0055;
            text-align: center;
            border-radius: 4px;
            position: relative;
          }

          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }

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
            overflow: hidden;
            flex-shrink: 0;
          }
          .share-btn-img:hover { background: #00ffcc; }
          .share-btn-img:hover .share-svg-icon { fill: #000; }

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

          .custom-options.open { display: block; }

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
            flex-shrink: 0;
          }
          .delete-item-btn:hover { background: #ff0055; color: #fff; }

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
          .clear-input-btn:hover { color: #ffff00; }

          input, button {
            background: #0f0f1b;
            color: #00ffcc;
            border: 2px solid #00ffcc;
            padding: 5px;
            font-family: 'DotGothic16', sans-serif;
            cursor: pointer;
            font-size: 13px;
          }

          input { color: #ffff00; cursor: text; }
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

          .weather-icon-box img { width: 64px; height: 64px; }
          .loading-icon { width: 48px; height: 48px; }
          .status-icon { width: 18px; height: 18px; vertical-align: middle; margin-right: 4px; }
          .detail-icon, .option-icon, .btn-icon { width: 16px; height: 16px; vertical-align: middle; }

          .temp-display { font-size: 28px; color: #ffff00; margin: 2px 0; }

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

          .detail-item { display: flex; align-items: center; gap: 6px; }

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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .embed-btn-square:hover { background: #888ff0; color: #000; }

          .modal-overlay {
            display: none;
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 10px;
          }
          .modal-card {
            background: #0f0f1b;
            border: 3px solid #00ffcc;
            box-shadow: 6px 6px 0px #ff0055;
            padding: 14px;
            width: 100%;
            text-align: left;
            border-radius: 4px;
          }
          .modal-title {
            color: #ffff00;
            font-size: 13px;
            margin-top: 0;
            margin-bottom: 8px;
            border-bottom: 2px dashed #00ffcc;
            padding-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .modal-desc { font-size: 11px; color: #00ffcc; line-height: 1.4; margin-bottom: 8px; }
          .modal-notice {
            font-size: 11px; color: #ff88a3; line-height: 1.4; margin-bottom: 8px;
            background: #2a081d; padding: 6px; border: 1px dashed #ff0055;
          }
          .code-textarea {
            width: 100%; height: 50px; background: #1a1a2e; color: #ffff00;
            border: 1px solid #00ffcc; font-family: monospace; font-size: 10px;
            padding: 4px; resize: none; margin-bottom: 8px;
          }
          .modal-actions { display: flex; gap: 4px; justify-content: flex-end; }
          .modal-actions button { font-size: 10px; padding: 4px 6px; display: flex; align-items: center; gap: 4px; }
        </style>

        <div class="widget-card">
          <div class="header-bar">
            <span style="font-size: 11px; color: #ff0055;">[ RETRO_WEATHER_v3.3 ]</span>
            <button id="shareBtn" class="share-btn-img" title="お天気メモとして保存・共有">
              <svg class="share-svg-icon" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77l-7.13-4.15c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
          </div>
          
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

          <div class="search-box">
            <div class="input-wrapper">
              <input type="text" id="searchInput" placeholder="例: 東京タワー, 秩父, 飯能">
              <button id="clearInputBtn" class="clear-input-btn">× </button>
            </div>
            <button id="searchBtn">追加</button>
          </div>

          <div class="weather-display">
            <div id="displayLocationName" style="font-size: 13px; color: #ffff00; margin-bottom: 4px;">---</div>
            <div class="weather-icon-box">
              <img id="weatherImg" class="pixel-icon" src="" alt="天気" style="display:none;">
              <img id="loadingImg" class="pixel-icon loading-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/23f3.png" alt="読み込み中">
            </div>
            <div id="weatherTelop" style="font-size: 17px;">データ取得中...</div>
            <div id="tempDisplay" class="temp-display">-- ℃</div>
          </div>

          <div class="barometer-box">
            <div>現地気圧: <span id="pressureDisplay">--</span> hPa</div>
            <div class="alert-container">
              <img id="pressureIcon" class="pixel-icon status-icon" src="" alt="気圧状態" style="display:none;">
              <span id="pressureAlert">チェック中...</span>
            </div>
          </div>

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

          <div class="embed-footer">
            <button id="openEmbedModal" class="embed-btn-square">
              <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2699.png" alt="設定">
              埋め込みコードを取得
            </button>
          </div>

          <!-- GPS確認モーダル -->
          <div id="initLocationModal" class="modal-overlay">
            <div class="modal-card">
              <h3 class="modal-title">
                <img class="pixel-icon btn-icon" src="${ICON_GPS}">
                位置情報の利用確認
              </h3>
              <div class="modal-desc">
                現在地のリアルタイムなお天気を取得しますか？<br>※端末のGPS機能をオンにしてご利用ください。
              </div>
              <div id="initModalNotice" class="modal-notice" style="display: none;">
                ⚠️ GPSがオフか許可されていません。<br>端末の設定でGPSをオンにしてから再試行してください。
              </div>
              <div class="modal-actions">
                <button id="initGpsBtn">
                  <img class="pixel-icon btn-icon" src="${ICON_PIN}">
                  <span id="initGpsBtnText">現在地を取得</span>
                </button>
                <button id="initCancelBtn" style="border-color: #ff0055; color: #ff0055;">デフォルト (東京)</button>
              </div>
            </div>
          </div>

          <!-- 埋め込みパーツ モーダル -->
          <div id="embedModal" class="modal-overlay">
            <div class="modal-card">
              <h3 class="modal-title">
                <img class="pixel-icon btn-icon" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f47e.png">
                お天気埋め込みパーツ
              </h3>
              <div class="modal-desc">
                ブログやHPに貼ると、本レトロお天気をそのまま読み込めるJS埋め込みコードです。
              </div>
              <textarea id="embedCodeText" class="code-textarea" readonly></textarea>
              <div class="modal-actions">
                <button id="copyEmbedBtn">コピー</button>
                <button id="closeEmbedModal" style="border-color: #ff0055; color: #ff0055;">閉じる</button>
              </div>
            </div>
          </div>

        </div>
      `;
    }

    initElements() {
      const sr = this.shadowRoot;
      this.selectTrigger = sr.getElementById('selectTrigger');
      this.selectOptions = sr.getElementById('selectOptions');
      this.selectedText = sr.getElementById('selectedText');
      this.gpsBtn = sr.getElementById('gpsBtn');
      this.searchBtn = sr.getElementById('searchBtn');
      this.searchInput = sr.getElementById('searchInput');
      this.clearInputBtn = sr.getElementById('clearInputBtn');
      this.shareBtn = sr.getElementById('shareBtn');

      this.openEmbedModal = sr.getElementById('openEmbedModal');
      this.closeEmbedModal = sr.getElementById('closeEmbedModal');
      this.embedModal = sr.getElementById('embedModal');
      this.embedCodeText = sr.getElementById('embedCodeText');
      this.copyEmbedBtn = sr.getElementById('copyEmbedBtn');

      this.initLocationModal = sr.getElementById('initLocationModal');
      this.initGpsBtn = sr.getElementById('initGpsBtn');
      this.initGpsBtnText = sr.getElementById('initGpsBtnText');
      this.initCancelBtn = sr.getElementById('initCancelBtn');
      this.initModalNotice = sr.getElementById('initModalNotice');

      this.initEvents();
    }

    initEvents() {
      this.initGpsBtn.addEventListener('click', () => this.executeGpsFetch(true));
      this.initCancelBtn.addEventListener('click', () => {
        localStorage.setItem(VISITED_KEY, 'true');
        localStorage.setItem(GPS_ALLOWED_KEY, 'false');
        this.closeInitModal();
        this.fetchWeatherData(this.selectedLocation);
      });

      this.searchInput.addEventListener('input', () => {
        this.clearInputBtn.style.display = this.searchInput.value ? 'block' : 'none';
      });

      this.clearInputBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.clearInputBtn.style.display = 'none';
        this.searchInput.focus();
      });

      this.selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectOptions.classList.toggle('open');
      });

      this.shadowRoot.addEventListener('click', () => this.selectOptions.classList.remove('open'));

      this.shareBtn.addEventListener('click', () => this.handleShare());

      this.openEmbedModal.addEventListener('click', () => {
        const scriptUrl = `https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/retro-weather-widget.js`;
        const embedCode = `<div id="retro-weather-widget"></div>\n<script src="${scriptUrl}" defer></script>`;
        this.embedCodeText.value = embedCode;
        this.embedModal.style.display = 'flex';
      });

      this.closeEmbedModal.addEventListener('click', () => {
        this.embedModal.style.display = 'none';
      });

      this.copyEmbedBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(this.embedCodeText.value);
          alert('埋め込みコードをコピーしました！');
        } catch (e) {
          this.embedCodeText.select();
          document.execCommand('copy');
          alert('コードをコピーしました！');
        }
      });

      this.searchBtn.addEventListener('click', () => this.handleSearch());
      this.gpsBtn.addEventListener('click', () => this.executeGpsFetch(true));
    }

    openInitModal() { this.initLocationModal.style.display = 'flex'; }
    closeInitModal() { this.initLocationModal.style.display = 'none'; }

    renderCustomSelect() {
      this.selectOptions.innerHTML = '';
      this.selectedText.innerHTML = `
        <span class="option-label">
          <img class="pixel-icon option-icon" src="${this.selectedLocation.icon}">
          ${this.selectedLocation.name}
        </span>
      `;

      this.currentLocations.forEach((loc, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-option';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'option-label';
        labelDiv.innerHTML = `<img class="pixel-icon option-icon" src="${loc.icon}"> ${loc.name}`;
        
        optionDiv.appendChild(labelDiv);

        if (!loc.isPreset) {
          const delBtn = document.createElement('button');
          delBtn.className = 'delete-item-btn';
          delBtn.innerText = '×';
          delBtn.title = '削除';
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteLocation(index);
          });
          optionDiv.appendChild(delBtn);
        }

        optionDiv.addEventListener('click', () => {
          this.selectedLocation = loc;
          this.renderCustomSelect();
          this.selectOptions.classList.remove('open');
          this.fetchWeatherData(this.selectedLocation);
        });

        this.selectOptions.appendChild(optionDiv);
      });
    }

    deleteLocation(index) {
      const target = this.currentLocations[index];
      this.currentLocations.splice(index, 1);
      
      const savedOnly = this.currentLocations.filter(l => !l.isPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedOnly));

      if (this.selectedLocation.name === target.name) {
        this.selectedLocation = this.currentLocations[0];
      }

      this.renderCustomSelect();
      this.fetchWeatherData(this.selectedLocation);
    }

    loadSavedLocations() {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      saved.forEach(loc => {
        loc.icon = ICON_SEARCH;
        this.currentLocations.push(loc);
      });
    }

    checkUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const lat = parseFloat(params.get('lat'));
      const lon = parseFloat(params.get('lon'));
      const name = params.get('name');

      if (lat && lon && name) {
        const decodedName = decodeURIComponent(name);
        const paramLoc = { name: decodedName, lat: lat, lon: lon, jmaFile: "130000", areaName: "東京地方", icon: ICON_SEARCH, isPreset: false };
        this.selectedLocation = paramLoc;
        this.searchInput.value = decodedName;
        this.clearInputBtn.style.display = 'block';
      }
    }

    async handleSearch() {
      const query = this.searchInput.value.trim();
      if (!query) return;

      const sr = this.shadowRoot;
      sr.getElementById('weatherTelop').innerText = '検索中...';

      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ja&format=json`;
        let res = await fetch(geoUrl).then(r => r.json());
        let place = res.results?.find(p => p.country_code === 'JP') || res.results?.[0];

        if (!place) {
          const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' 日本')}&limit=1`;
          const osmRes = await fetch(osmUrl).then(r => r.json());
          if (osmRes && osmRes.length > 0) {
            place = { name: query, latitude: parseFloat(osmRes[0].lat), longitude: parseFloat(osmRes[0].lon) };
          }
        }

        if (!place) {
          alert('該当する場所が見つかりませんでした');
          sr.getElementById('weatherTelop').innerText = '検索失敗';
          return;
        }

        const newLoc = { name: query, lat: place.latitude, lon: place.longitude, jmaFile: "130000", areaName: "東京地方", icon: ICON_SEARCH, isPreset: false };

        const exists = this.currentLocations.some(l => l.name === newLoc.name);
        if (!exists) {
          this.currentLocations.push(newLoc);
          const savedOnly = this.currentLocations.filter(l => !l.isPreset);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(savedOnly));
        }

        this.selectedLocation = newLoc;
        this.renderCustomSelect();
        this.fetchWeatherData(this.selectedLocation);

      } catch (err) {
        console.error(err);
        alert('検索エラーが発生しました');
      }
    }

    executeGpsFetch(isInteractive = false) {
      const sr = this.shadowRoot;
      if (!navigator.geolocation) {
        this.handleGpsError();
        return;
      }

      sr.getElementById('weatherTelop').innerText = '現在地を取得中...';

      const gpsTimeout = setTimeout(() => {
        this.handleGpsError();
      }, 5000);

      navigator.geolocation.getCurrentPosition(async position => {
        clearTimeout(gpsTimeout);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        localStorage.setItem(VISITED_KEY, 'true');
        localStorage.setItem(GPS_ALLOWED_KEY, 'true');
        this.closeInitModal();

        let detectedCity = "";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&accept-language=ja`).then(r => r.json());
          if (res && res.address) {
            detectedCity = res.address.city || res.address.town || res.address.village || res.address.suburb || res.address.county || "";
          }
        } catch (e) {}

        if (detectedCity) {
          this.searchInput.value = detectedCity;
          this.clearInputBtn.style.display = 'block';
        }

        const gpsLoc = { name: "現在地", subName: detectedCity, lat: lat, lon: lon, jmaFile: "130000", areaName: "東京地方", icon: ICON_GPS, isPreset: true };

        this.currentLocations[0] = gpsLoc;
        this.selectedLocation = gpsLoc;
        this.renderCustomSelect();
        this.fetchWeatherData(this.selectedLocation);
      }, () => {
        clearTimeout(gpsTimeout);
        this.handleGpsError();
      }, { timeout: 5000, enableHighAccuracy: true });
    }

    handleGpsError() {
      localStorage.setItem(VISITED_KEY, 'true');
      localStorage.setItem(GPS_ALLOWED_KEY, 'false');
      
      this.openInitModal();
      this.initModalNotice.style.display = 'block';
      this.initGpsBtnText.innerText = 'オンにしたので再試行';
      
      this.fetchWeatherData(this.selectedLocation);
    }

    async fetchWeatherData(locationData) {
      const sr = this.shadowRoot;
      sr.getElementById('loadingImg').style.display = 'inline';
      sr.getElementById('weatherImg').style.display = 'none';
      sr.getElementById('weatherTelop').innerText = '通信中...';

      let displayName = `[ ${locationData.name} ]`;
      if (locationData.name === "現在地" && locationData.subName) {
        displayName = `[ 現在地 : ${locationData.subName} ]`;
      }
      sr.getElementById('displayLocationName').innerText = displayName;

      try {
        const jmaUrl = `https://www.jma.go.jp/bosai/forecast/data/forecast/${locationData.jmaFile}.json`;
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${locationData.lat}&longitude=${locationData.lon}&current=temperature_2m,wind_speed_10m,uv_index,surface_pressure&timezone=Asia%2FTokyo`;
        const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${locationData.lat}&longitude=${locationData.lon}&current=birch_pollen&timezone=Asia%2FTokyo`;

        const [jmaRes, openMeteoRes, pollenRes] = await Promise.all([
          fetch(jmaUrl).then(r => r.json()).catch(() => null),
          fetch(openMeteoUrl).then(r => r.json()),
          fetch(pollenUrl).then(r => r.json()).catch(() => null)
        ]);

        let jmaWeatherTelop = "晴れ/曇り";
        if (jmaRes && jmaRes[0]?.timeSeries[0]?.areas) {
          const areas = jmaRes[0].timeSeries[0].areas;
          const targetArea = areas.find(a => a.area.name.includes(locationData.areaName)) || areas[0];
          jmaWeatherTelop = targetArea.weathers[0];
        }

        const currentTemp = openMeteoRes.current.temperature_2m;
        const windSpeed = openMeteoRes.current.wind_speed_10m;
        const uvIndex = openMeteoRes.current.uv_index;
        const pressure = openMeteoRes.current.surface_pressure;
        const birchPollen = pollenRes?.current?.birch_pollen ?? 0;
        const pollenText = birchPollen > 0 ? `${birchPollen} (飛散中)` : '少ない/無';

        sr.getElementById('weatherTelop').innerText = jmaWeatherTelop;
        sr.getElementById('tempDisplay').innerText = `${currentTemp} ℃`;
        sr.getElementById('windSpeed').innerText = windSpeed;
        sr.getElementById('uvIndex').innerText = uvIndex;
        sr.getElementById('pressureDisplay').innerText = pressure;
        sr.getElementById('pollenIndex').innerText = pollenText;

        this.currentFetchedData = { weather: jmaWeatherTelop, temp: currentTemp, pressure: pressure, wind: windSpeed, uv: uvIndex, pollen: pollenText };

        this.evaluatePressure(pressure);

        const imgEl = sr.getElementById('weatherImg');
        imgEl.src = this.getPixelIconUrl(jmaWeatherTelop);
        imgEl.style.display = 'inline';
        sr.getElementById('loadingImg').style.display = 'none';

      } catch (error) {
        console.error('Fetch Error:', error);
        sr.getElementById('weatherTelop').innerText = 'データ取得失敗';
      }
    }

    evaluatePressure(pressure) {
      const sr = this.shadowRoot;
      const alertEl = sr.getElementById('pressureAlert');
      const iconEl = sr.getElementById('pressureIcon');
      iconEl.style.display = 'inline-block';

      if (pressure < 1005) {
        alertEl.innerText = '低気圧警戒！無理せず休もう';
        alertEl.style.color = '#ff3366';
        iconEl.src = 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26a0.png';
      } else if (pressure < 1010) {
        alertEl.innerText = 'やや低気圧：頭痛・倦怠感注意';
        alertEl.style.color = '#ff9900';
        iconEl.src = 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26a1.png';
      } else {
        alertEl.innerText = '気圧安定：快適コンディション';
        alertEl.style.color = '#00ffcc';
        iconEl.src = 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2728.png';
      }
    }

    getPixelIconUrl(telop) {
      if (telop.includes('晴')) return 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2600.png';
      if (telop.includes('雨')) return 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f327.png';
      if (telop.includes('くもり') || telop.includes('曇')) return 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2601.png';
      if (telop.includes('雪')) return 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2744.png';
      return 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f47e.png';
    }

    async handleShare() {
      const baseUrl = window.location.origin + window.location.pathname;
      let shareName = this.selectedLocation.name;
      if (this.selectedLocation.name === "現在地" && this.selectedLocation.subName) {
        shareName = this.selectedLocation.subName;
      }

      const shareUrl = `${baseUrl}?lat=${this.selectedLocation.lat}&lon=${this.selectedLocation.lon}&name=${encodeURIComponent(shareName)}`;
      const now = new Date();
      const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      const shareText = `【お天気メモ日記】\n--------------------\n📅 日時: ${timeStr}\n📍 場所: ${shareName}\n\n🌤️ 天気: ${this.currentFetchedData.weather}\n🌡️ 気温: ${this.currentFetchedData.temp} ℃\n🎈 気圧: ${this.currentFetchedData.pressure} hPa\n💨 風速: ${this.currentFetchedData.wind} m/s\n☀️ UV指数: ${this.currentFetchedData.uv}\n🌲 スギ花粉: ${this.currentFetchedData.pollen}\n--------------------\n🔗 リアルタイムお天気リンク:\n${shareUrl}`;

      if (navigator.share) {
        try { await navigator.share({ title: `${shareName}のお天気メモ`, text: shareText }); } catch (err) {}
      } else {
        try {
          await navigator.clipboard.writeText(shareText);
          alert(`お天気メモをコピーしました！\n\n${shareText}`);
        } catch (err) {
          prompt('以下のテキストをコピーしてください:', shareText);
        }
      }
    }
  }

  customElements.define('retro-weather-widget', RetroWeatherWidget);

  // 自動配置処理
  window.addEventListener('DOMContentLoaded', () => {
    let targetContainer = document.getElementById('retro-weather-widget');
    if (!targetContainer) {
      targetContainer = document.createElement('div');
      targetContainer.id = 'retro-weather-widget';
      document.body.appendChild(targetContainer);
    }
    targetContainer.appendChild(document.createElement('retro-weather-widget'));
  });
})();

