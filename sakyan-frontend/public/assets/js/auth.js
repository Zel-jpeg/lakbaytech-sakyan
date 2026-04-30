// ─────────────────────────────────────────────────
// auth.js — Supabase Auth: email/password + Google OAuth
// Handles login, register, logout, session, role redirect
// ─────────────────────────────────────────────────

const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── Role-based redirect ───────────────────────────
function redirectByRole(role) {
    const redirects = {
        admin:    '/pages/admin/dashboard.html',
        partner:  '/pages/partner/dashboard.html',
        customer: '/pages/browse/cars.html'
    };
    window.location.href = redirects[role] || '/pages/browse/cars.html';
}

// ── Store session token ───────────────────────────
function storeSession(session) {
    if (session?.access_token) {
        localStorage.setItem('sakyan_token', session.access_token);
    }
}

// ── Get current user from backend ─────────────────
async function fetchMe() {
    try {
        const res = await api.get('/auth/me');
        return res.data;
    } catch {
        return null;
    }
}

// ── Email/Password Login ──────────────────────────
async function login(email, password) {
    showLoader();
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        storeSession(data.session);
        const user = await fetchMe();
        redirectByRole(user?.role);
    } catch (err) {
        showToast(err.message, 'danger');
    } finally {
        hideLoader();
    }
}

// ── Email/Password Register ───────────────────────
async function register(email, password, fullName, phone) {
    showLoader();
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) throw error;

        // Backend creates user record in users table
        await api.post('/auth/register', {
            user_id: data.user.id,
            email,
            full_name: fullName,
            phone
        });

        showToast('Registration successful! Please check your email to confirm.', 'success');
        setTimeout(() => window.location.href = '/pages/auth/login.html', 2000);
    } catch (err) {
        showToast(err.message, 'danger');
    } finally {
        hideLoader();
    }
}

// ── Google OAuth Login ────────────────────────────
async function loginWithGoogle() {
    showLoader();
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/pages/auth/callback.html'
            }
        });
        if (error) throw error;
    } catch (err) {
        showToast(err.message, 'danger');
        hideLoader();
    }
}

// ── OAuth Callback Handler (callback.html calls this) ──
async function handleOAuthCallback() {
    showLoader();
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session) throw new Error('No session found after OAuth.');

        storeSession(session);

        // Backend upserts user in users table (in case it's their first Google login)
        await api.post('/auth/google/callback', {});

        const user = await fetchMe();
        redirectByRole(user?.role);
    } catch (err) {
        showToast('Login failed: ' + err.message, 'danger');
        setTimeout(() => window.location.href = '/pages/auth/login.html', 2000);
    } finally {
        hideLoader();
    }
}

// ── Logout ────────────────────────────────────────
async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('sakyan_token');
    window.location.href = '/';
}

// ── Guard: redirect if not logged in ─────────────
// roles (optional): array of allowed roles e.g. ['partner','admin']
async function requireAuth(roles = null) {
    const token = localStorage.getItem('sakyan_token');
    if (!token) {
        window.location.href = '/pages/auth/login.html';
        return null;
    }
    const user = await fetchMe();
    if (!user) {
        localStorage.removeItem('sakyan_token');
        window.location.href = '/pages/auth/login.html';
        return null;
    }
    if (roles && !roles.includes(user.role)) {
        // Wrong role — redirect to correct dashboard
        redirectByRole(user.role);
        return null;
    }
    return user;
}

// ── Guard: redirect if not specific role ──────────
async function requireRole(role) {
    return requireAuth([role]);
}

// ── Auto-restore session on page load ─────────────
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        storeSession(session);
    }
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sakyan_token');
    }
    if (event === 'TOKEN_REFRESHED' && session) {
        storeSession(session);
    }
});
