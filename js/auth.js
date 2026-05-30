/**
 * Şifre doğrulama — SHA-256 ile hash karşılaştırması.
 *
 * Şifreyi değiştirmek için:
 *  1. Tarayıcı konsoluna şunu yazın:
 *       crypto.subtle.digest('SHA-256', new TextEncoder().encode('YeniSifren'))
 *         .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
 *  2. Çıkan hex string'i aşağıdaki CORRECT_HASH değişkenine yapıştırın.
 *
 * Varsayılan şifre: Kimseninasla.kıramayacagısifre
 */

// SHA-256('Kimseninasla.kıramayacagısifre')
const CORRECT_USERNAME = 'admin';
const CORRECT_HASH     = 'a9404068c83927fc627cc1b46c8aabd7deaa58331ddcbb8ffbbb92564c37a5be';

async function sha256(message) {
    const msgBuffer  = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateLogin(event) {
    event.preventDefault();

    const username  = document.getElementById('username').value.trim();
    const password  = document.getElementById('password').value;
    const errorDiv  = document.getElementById('error');

    const hash = await sha256(password);

    if (username === CORRECT_USERNAME && hash === CORRECT_HASH) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        window.location.href = 'admin-panel.html';
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent   = 'Hatalı kullanıcı adı veya şifre!';
    }

    return false;
}
