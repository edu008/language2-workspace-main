/**
 * js-optimization.js
 * 
 * This file contains JavaScript optimizations and performance improvements
 * for the application. It uses safe, modern JavaScript practices without
 * relying on eval() or other potentially unsafe code execution methods.
 */

(function() {
  'use strict';
  
  // Performance monitoring utilities
  const PerformanceMonitor = {
    marks: {},
    
    // Start timing a named operation
    start: function(name) {
      if (typeof performance === 'undefined') return;
      const markName = `${name}_start`;
      performance.mark(markName);
      this.marks[name] = markName;
    },
    
    // End timing and log the result
    end: function(name, logToConsole = true) {
      if (typeof performance === 'undefined') return;
      const startMark = this.marks[name];
      if (!startMark) return;
      
      const endMark = `${name}_end`;
      performance.mark(endMark);
      
      const measureName = `${name}_measure`;
      performance.measure(measureName, startMark, endMark);
      
      const entries = performance.getEntriesByName(measureName);
      const duration = entries.length > 0 ? entries[0].duration : 0;
      
      if (logToConsole) {
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
      delete this.marks[name];
      
      return duration;
    }
  };
  
  // Debounce function to limit how often a function can be called
  const debounce = function(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };
  
  // Throttle function to limit how often a function can be called
  const throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  // Safe JSON parser that doesn't use eval
  const safeJSONParse = function(str, fallback = {}) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return fallback;
    }
  };
  
  // Function to safely get nested object properties without errors
  const getNestedProperty = function(obj, path, defaultValue = undefined) {
    if (!obj || !path) return defaultValue;
    
    const properties = Array.isArray(path) ? path : path.split('.');
    let current = obj;
    
    for (let i = 0; i < properties.length; i++) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[properties[i]];
    }
    
    return current !== undefined ? current : defaultValue;
  };
  
  // Lazy loading images
  const setupLazyLoading = function() {
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target;
            if (lazyImage.dataset.src) {
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.removeAttribute('data-src');
              lazyImageObserver.unobserve(lazyImage);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach((img) => {
        lazyImageObserver.observe(img);
      });
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      const lazyLoad = function() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach((img) => {
          if (img.getBoundingClientRect().top <= window.innerHeight && 
              img.getBoundingClientRect().bottom >= 0 &&
              getComputedStyle(img).display !== 'none') {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        });
        
        if (lazyImages.length === 0) {
          document.removeEventListener('scroll', lazyLoadThrottled);
          window.removeEventListener('resize', lazyLoadThrottled);
          window.removeEventListener('orientationchange', lazyLoadThrottled);
        }
      };
      
      const lazyLoadThrottled = throttle(lazyLoad, 200);
      
      document.addEventListener('scroll', lazyLoadThrottled);
      window.addEventListener('resize', lazyLoadThrottled);
      window.addEventListener('orientationchange', lazyLoadThrottled);
    }
  };
  
  // Memory management - clean up event listeners and references
  const cleanupEventListeners = function(element, eventMap) {
    if (!element || !eventMap) return;
    
    Object.entries(eventMap).forEach(([eventName, handler]) => {
      element.removeEventListener(eventName, handler);
    });
  };
  
  // Function to create DOM elements without using innerHTML (safer than innerHTML)
  const createElement = function(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Append children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  };
  
  // Expose utilities to global scope
  window.JsOptimization = {
    PerformanceMonitor,
    debounce,
    throttle,
    safeJSONParse,
    getNestedProperty,
    setupLazyLoading,
    cleanupEventListeners,
    createElement
  };
  
  // Initialize optimizations when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Setup lazy loading for images
    setupLazyLoading();
    
    console.log('JS optimizations initialized');
  });
})();
