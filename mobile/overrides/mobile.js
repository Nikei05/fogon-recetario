(function () {
  'use strict';

  /* Enlaces externos (Hotmart) -> navegador del sistema, no dentro del WebView. */
  function findExternalLink(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.tagName === 'A') {
        var href = el.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener(
    'click',
    function (event) {
      var link = findExternalLink(event.target);
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      var url = link.href;
      try {
        window.open(url, '_system');
      } catch (error) {
        window.open(url, '_blank');
      }
    },
    true
  );

  /* Botón atrás de Android: cierra modales y navega dentro de la app. */
  function closeIfOpen(id, closer) {
    var el = document.getElementById(id);
    if (!el) return false;
    var visible = el.style.display === 'flex' || el.style.display === 'block';
    if (!visible) return false;
    el.style.display = 'none';
    if (typeof closer === 'function') {
      try {
        closer();
      } catch (error) {
        /* noop */
      }
    }
    return true;
  }

  function getAppPlugin() {
    var cap = window.Capacitor;
    if (!cap) return null;
    if (cap.Plugins && cap.Plugins.App) return cap.Plugins.App;
    if (typeof cap.registerPlugin === 'function') return cap.registerPlugin('App');
    return null;
  }

  function goBack() {
    if (closeIfOpen('custom-upsell', window.cerrarUpsell)) return;
    if (closeIfOpen('custom-modal', window.cerrarAlerta)) return;
    if (closeIfOpen('custom-prompt', window.cerrarPrompt)) return;
    if (closeIfOpen('modal-timer-picker', window.cerrarPickerTiempo)) return;

    var active = document.querySelector('.screen.active');
    var id = active ? active.id : '';

    switch (id) {
      case 'screen-inicio':
      case 'screen-pin':
        var appPlugin = getAppPlugin();
        if (appPlugin) appPlugin.exitApp();
        return;
      case 'screen-compra':
        if (typeof window.regresarDeCompra === 'function') return window.regresarDeCompra();
        break;
      case 'screen-personas':
        if (typeof window.irPantalla === 'function') return window.irPantalla('screen-inicio');
        break;
      case 'screen-proteina':
        if (typeof window.regresarAPersonas === 'function') return window.regresarAPersonas();
        break;
      case 'screen-receta':
        if (typeof window.regresarAProteina === 'function') return window.regresarAProteina();
        break;
      case 'screen-pasos':
        if (typeof window.pasoAnterior === 'function') return window.pasoAnterior();
        break;
      case 'screen-final':
        if (typeof window.regresarAPasosFin === 'function') return window.regresarAPasosFin();
        break;
      default:
        break;
    }

    if (typeof window.irPantalla === 'function') window.irPantalla('screen-inicio');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var appPlugin = getAppPlugin();
    if (!appPlugin) return;
    try {
      var listener = appPlugin.addListener('backButton', goBack);
      if (listener && typeof listener.catch === 'function') listener.catch(function () {});
    } catch (error) {
      /* La app sigue funcionando aunque el plugin no esté disponible */
    }
  });
})();
