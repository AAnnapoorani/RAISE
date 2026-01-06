// ==========================================
//      TOAST NOTIFICATION SYSTEM
// ==========================================
// Global toast notification component for user feedback
// Supports: success, error, info, and warning types
// Usage: showToast("Your message", "success")

// ==========================================
//      TOAST CSS STYLES
// ==========================================
// Define all toast styling including animations and dark mode support
const toastStyles = `
    #toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }
    .toast {
        min-width: 300px;
        background: white;
        color: #1e293b;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out forwards;
        pointer-events: auto;
        border-left: 4px solid;
    }
    /* Dark mode support */
    .dark .toast {
        background: #1e293b;
        color: #f8fafc;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
    .toast-success { border-color: #10b981; } /* Green */
    .toast-error { border-color: #ef4444; }   /* Red */
    .toast-info { border-color: #3b82f6; }    /* Blue */
    .toast-warning { border-color: #f59e0b; } /* Orange */
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        to { opacity: 0; transform: translateX(20px); }
    }
`;

// ==========================================
//      INITIALIZATION ON PAGE LOAD
// ==========================================
// Inject CSS styles and create toast container when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Inject CSS
    const styleSheet = document.createElement("style");
    styleSheet.innerText = toastStyles;
    document.head.appendChild(styleSheet);

    // Create Container
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
});

// ==========================================
//      SHOW TOAST FUNCTION
// ==========================================
// Display a toast notification with icon and auto-dismiss
// Parameters:
//   - message: Text to display
//   - type: 'success', 'error', 'info', or 'warning'
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return; 

    const toast = document.createElement('div');
    
    // ==========================================
    //      ICON MAPPING BY TYPE
    // ==========================================
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';

    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 20px;">${icon}</span>
        <div class="flex flex-col">
            <span class="text-sm font-bold capitalize">${type}</span>
            <span class="text-xs opacity-90">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    // ==========================================
    //      AUTO-DISMISS TIMER
    // ==========================================
    // Remove toast after 3 seconds with fade-out animation
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};