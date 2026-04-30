// ─────────────────────────────────────────────────
// utils.js — Toast notifications, loaders, formatters
// ─────────────────────────────────────────────────

// ── Toast Notification ────────────────────────────
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.sakyan-toast').forEach(t => t.remove());

    const colors = {
        success: '#198754',
        danger:  '#dc3545',
        warning: '#ffc107',
        info:    '#0d6efd'
    };

    const toast = document.createElement('div');
    toast.className = 'sakyan-toast';
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        max-width: 360px;
        animation: slideIn 0.3s ease;
    `;

    // Add animation style if not present
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(110%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Page Loader ───────────────────────────────────
function showLoader() {
    if (document.getElementById('sakyan-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'sakyan-loader';
    loader.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
            <div class="spinner-border spinner-border-sm text-light" role="status"></div>
            <span style="color:white;font-size:14px;">Loading...</span>
        </div>
    `;
    loader.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.45); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    document.getElementById('sakyan-loader')?.remove();
}

// ── Button Loading State ──────────────────────────
function setButtonLoading(btn, loading = true, text = 'Loading...') {
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${text}`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || text;
    }
}

// ── Currency Formatter ────────────────────────────
function formatPHP(amount) {
    return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ── Date Formatter ────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

// ── Booking Status Badge ──────────────────────────
function statusBadge(status) {
    const map = {
        pending_review: ['warning', '⏳ Pending Review'],
        approved:       ['success', '✅ Approved'],
        rejected:       ['danger',  '❌ Rejected'],
        active:         ['primary', '🚗 Active'],
        completed:      ['secondary','✔ Completed'],
        cancelled:      ['dark',    '🚫 Cancelled']
    };
    const [color, label] = map[status] || ['secondary', status];
    return `<span class="badge bg-${color}">${label}</span>`;
}

// ── Load HTML component into element ─────────────
async function loadComponent(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
        const res = await fetch(url);
        el.innerHTML = await res.text();
        // Update nav based on auth state
        const token = localStorage.getItem('sakyan_token');
        if (token) {
            document.getElementById('auth-buttons')?.classList.add('d-none');
            document.getElementById('user-menu')?.classList.remove('d-none');
        }
    } catch (e) {
        console.warn(`Could not load component: ${url}`);
    }
}

// ── Calculate rental days ─────────────────────────
function calcDays(startDate, endDate) {
    const start = new Date(startDate);
    const end   = new Date(endDate);
    const diff  = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
}

// ── Truncate text ─────────────────────────────────
function truncate(str, max = 80) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
}
