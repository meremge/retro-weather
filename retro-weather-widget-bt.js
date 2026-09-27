(function() {
  class RetroWeatherWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      this.shadowRoot.innerHTML = `
<script><!--
var fc2footerparam = 'ver=1'
    + '&url=' + encodeURIComponent(document.location)
    + '&service=0'
    + '&r=' + Math.floor(Math.random() * 99999999999);
var fc2footertag = "//vip.chps-api.fc2.com/apis/footer/?" + fc2footerparam;
var script = document.createElement('script');
script.src = fc2footertag;
script.charset = "UTF-8";
script.async = true;
document.getElementsByTagName('head')[0].appendChild(script);
//--></script>
<!-- FC2, inc.-->
<img src="//media.fc2.com/counter_img.php?id=50" style="display:none" alt="inserted by FC2 system" width="0" height="0">
<!-- FC2, inc.-->
      `;
    }
  }
  if (!customElements.get('retro-weather-widget')) {
    customElements.define('retro-weather-widget', RetroWeatherWidget);
  }
})();
