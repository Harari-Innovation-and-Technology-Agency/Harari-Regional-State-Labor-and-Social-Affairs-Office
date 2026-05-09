// Global notification system - No dependencies
(function(global) {
  'use strict';

  // Add styles once
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Show notification function
  function showNotification(message, type = 'success') {
    console.log(`🔔 Notification (${type}): ${message}`);
    
    // Remove existing notifications
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 400px;
      background: ${getBackgroundColor(type)};
    `;
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = `fas ${getIcon(type)}`;
    icon.style.fontSize = '18px';
    notification.appendChild(icon);
    
    // Add message
    const span = document.createElement('span');
    span.textContent = message;
    notification.appendChild(span);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      margin-left: 15px;
      opacity: 0.8;
      padding: 0 5px;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
    closeBtn.onclick = () => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    };
    notification.appendChild(closeBtn);
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  // Helper functions
  function getBackgroundColor(type) {
    switch(type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#10b981';
    }
  }

  function getIcon(type) {
    switch(type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-check-circle';
    }
  }

  // Make it globally available
  global.showNotification = showNotification;

})(window);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.Notification;
}