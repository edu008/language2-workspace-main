/**
 * bfcache-helper.js
 * 
 * This script helps improve back/forward cache compatibility by detecting and
 * closing WebSocket connections when the page is about to be cached.
 */

(function() {
  // Function to clean up WebSocket connections
  function cleanupWebSockets() {
    if (typeof window === 'undefined') return;
    
    try {
      // Find all potential WebSocket instances
      const websockets = Object.keys(window)
        .filter(key => 
          key.includes('WebSocket') || 
          (window[key] && 
           typeof window[key] === 'object' && 
           window[key].OPEN)
        )
        .map(key => window[key]);
      
      // Close any open WebSocket connections
      websockets.forEach(ws => {
        if (ws && typeof ws.close === 'function') {
          try {
            ws.close();
            console.log('Closed WebSocket connection for bfcache compatibility');
          } catch (e) {
            console.warn('Error closing WebSocket:', e);
          }
        }
      });
      
      // Also check for any instances in the global scope
      if (window.WebSocket) {
        const instances = Object.keys(window)
          .filter(key => window[key] instanceof WebSocket)
          .map(key => window[key]);
        
        instances.forEach(ws => {
          if (ws && ws.readyState === WebSocket.OPEN && typeof ws.close === 'function') {
            try {
              ws.close();
              console.log('Closed WebSocket instance for bfcache compatibility');
            } catch (e) {
              console.warn('Error closing WebSocket instance:', e);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error in WebSocket cleanup:', error);
    }
  }

  // Listen for page hide event (when page might enter bfcache)
  window.addEventListener('pagehide', function(event) {
    if (event.persisted) {
      // This page is being cached by the browser for back/forward navigation
      cleanupWebSockets();
    }
  });

  // Listen for before unload event
  window.addEventListener('beforeunload', cleanupWebSockets);

  // Listen for freeze event (page is being frozen for bfcache)
  if ('freeze' in document) {
    document.addEventListener('freeze', cleanupWebSockets);
  }

  // Listen for resume event (page is being restored from bfcache)
  if ('resume' in document) {
    document.addEventListener('resume', function() {
      // Reconnect WebSockets if needed when page is restored from bfcache
      console.log('Page resumed from bfcache');
    });
  }

  console.log('BFCache helper initialized');
})();
