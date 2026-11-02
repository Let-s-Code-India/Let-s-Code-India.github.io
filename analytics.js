(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', 'G-MNY0YNYCZS', {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  function loadAnalytics() {
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-MNY0YNYCZS';
    script.async = true;
    document.head.appendChild(script);
  }

  function scheduleAnalytics() {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
      } else {
        loadAnalytics();
      }
    }, 10000);
  }

  if (document.readyState === 'complete') {
    scheduleAnalytics();
  } else {
    window.addEventListener('load', scheduleAnalytics, { once: true });
  }
})();