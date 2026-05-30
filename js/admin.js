// ─── Supabase Yapılandırması ──────────────────────────────────────────────────
const SUPABASE_URL  = 'https://bsddhbdtexrqphaxxtfo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZGRoYmR0ZXhycXBoYXh4dGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjUwMDUsImV4cCI6MjA5NTcwMTAwNX0.v_V72MrdaZHEurlaGHuA_QhROMJvlARWbWzALMTstd4';

const sbHeaders = {
    'apikey': SUPABASE_ANON,
    'Authorization': 'Bearer ' + SUPABASE_ANON,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// ─── Cloudinary Yapılandırması ───────────────────────────────────────────────
const cloudinaryConfig = {
    cloudName:    'ddoy6aifm',
    uploadPreset: 'arsaofisim_preset'
};

// ─── Supabase Yardımcı Fonksiyonlar ──────────────────────────────────────────
async function sbGet() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`,
        { headers: sbHeaders }
    );
    if (!res.ok) throw new Error('Okuma hatası: ' + res.status);
    return await res.json();
}

async function sbInsert(data) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/properties`,
        { method: 'POST', headers: sbHeaders, body: JSON.stringify(data) }
    );
    if (!res.ok) {
        const err = await res.text();
        throw new Error('Ekleme hatası: ' + err);
    }
    return await res.json();
}

async function sbUpdate(id, data) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`,
        { method: 'PATCH', headers: sbHeaders, body: JSON.stringify(data) }
    );
    if (!res.ok) throw new Error('Güncelleme hatası: ' + res.status);
    return await res.json();
}

async function sbDelete(id) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`,
        { method: 'DELETE', headers: sbHeaders }
    );
    if (!res.ok) throw new Error('Silme hatası: ' + res.status);
}

// ─── DOMContentLoaded ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    if (!sessionStorage.getItem('adminLoggedIn')) {
        window.location.href = 'admin-login.html';
        return;
    }
    showSection('dashboard');
    loadProperties();
    renderDashboard();
});

// ─── Resim Yükleme ───────────────────────────────────────────────────────────
async function uploadImages(files) {
    const urls = [];
    for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', cloudinaryConfig.uploadPreset);
        try {
            const res  = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
                { method: 'POST', body: fd }
            );
            const data = await res.json();
            if (data.secure_url) urls.push(data.secure_url);
            else console.error('Cloudinary yanıtı:', data);
        } catch (err) {
            console.error('Resim yükleme hatası:', err);
        }
    }
    return urls;
}

// ─── Resim Önizleme ──────────────────────────────────────────────────────────
function previewImages(event) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    Array.from(event.target.files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const img    = document.createElement('img');
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        preview.appendChild(img);
    });
}

// ─── İlan Kaydetme ───────────────────────────────────────────────────────────
async function saveProperty(event) {
    event.preventDefault();
    const btn          = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Yükleniyor...';
    btn.disabled  = true;

    try {
        const fd = new FormData(event.target);

        const propertyData = {
            title:    fd.get('title'),
            type:     fd.get('type'),
            price:    Number(fd.get('price')),
            location: fd.get('location'),
            features: fd.get('features') || null,
            images:   []
        };

        const files = fd.getAll('images').filter(f => f.size > 0);
        if (files.length > 0) {
            propertyData.images = await uploadImages(files);
        }

        await sbInsert(propertyData);

        alert('İlan başarıyla kaydedildi!');
        event.target.reset();
        document.getElementById('imagePreview').innerHTML = '';
        await loadProperties();
        await renderDashboard();

    } catch (err) {
        console.error(err);
        alert('Bir hata oluştu: ' + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled  = false;
    }

    return false;
}

// ─── İlanları Listele ────────────────────────────────────────────────────────
let cachedProperties = [];

async function loadProperties() {
    const container = document.getElementById('propertyListContainer');
    container.innerHTML = '<p style="color:#7f8c8d;padding:20px;">Yükleniyor...</p>';

    try {
        cachedProperties = await sbGet();
    } catch (err) {
        container.innerHTML = `<p style="color:#e74c3c;padding:20px;">Hata: ${err.message}</p>`;
        return;
    }

    if (cachedProperties.length === 0) {
        container.innerHTML = '<p style="color:#7f8c8d;padding:20px;">Henüz ilan bulunmuyor.</p>';
        return;
    }

    container.innerHTML = cachedProperties.map(p => `
        <div class="property-card">
            <div class="property-image">
                ${p.images && p.images.length > 0
                    ? `<img src="${p.images[0]}" alt="${p.title}">`
                    : '🏠'}
            </div>
            <div class="property-info">
                <h3>${p.title}</h3>
                <p>📍 ${p.location}</p>
                <p>💰 ₺${Number(p.price).toLocaleString('tr-TR')}</p>
                <p>🏷️ ${p.type === 'satilik' ? 'Satılık' : 'Kiralık'}</p>
            </div>
            <div class="property-actions">
                <button class="edit-btn"   onclick="editProperty(${p.id})">Düzenle</button>
                <button class="delete-btn" onclick="deleteProperty(${p.id})">Sil</button>
            </div>
        </div>`).join('');
}

// ─── Dashboard Sayıları ──────────────────────────────────────────────────────
async function renderDashboard() {
    try {
        if (cachedProperties.length === 0) cachedProperties = await sbGet();
    } catch (err) { /* sessiz geç */ }

    const satilik = cachedProperties.filter(p => p.type === 'satilik').length;
    const kiralik = cachedProperties.filter(p => p.type === 'kiralik').length;

    document.querySelector('.dashboard-stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${cachedProperties.length}</div>
            <div class="stat-label">Toplam İlan</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${satilik}</div>
            <div class="stat-label">Satılık İlan</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${kiralik}</div>
            <div class="stat-label">Kiralık İlan</div>
        </div>`;
}

// ─── İlan Düzenleme ──────────────────────────────────────────────────────────
function editProperty(id) {
    const property = cachedProperties.find(p => p.id === id);
    if (!property) return;

    showSection('add-property');
    const form = document.getElementById('propertyForm');
    form.elements['title'].value    = property.title;
    form.elements['type'].value     = property.type;
    form.elements['price'].value    = property.price;
    form.elements['location'].value = property.location;
    form.elements['features'].value = property.features || '';

    const preview = document.getElementById('imagePreview');
    preview.innerHTML = (property.images || []).map(url =>
        `<img src="${url}" style="max-width:150px;max-height:150px;">`
    ).join('');

    form.onsubmit = async (e) => {
        e.preventDefault();

        const updatedData = {
            title:    form.elements['title'].value,
            type:     form.elements['type'].value,
            price:    Number(form.elements['price'].value),
            location: form.elements['location'].value,
            features: form.elements['features'].value || null,
            images:   property.images || []
        };

        const newFiles = Array.from(form.elements['images'].files).filter(f => f.size > 0);
        if (newFiles.length > 0) {
            const newUrls = await uploadImages(newFiles);
            updatedData.images = [...updatedData.images, ...newUrls];
        }

        try {
            await sbUpdate(id, updatedData);
            alert('İlan başarıyla güncellendi!');
            form.reset();
            preview.innerHTML = '';
            form.onsubmit = saveProperty;
            await loadProperties();
            await renderDashboard();
            showSection('property-list');
        } catch (err) {
            alert('Güncelleme hatası: ' + err.message);
        }

        return false;
    };
}

// ─── İlan Silme ──────────────────────────────────────────────────────────────
async function deleteProperty(id) {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
    try {
        await sbDelete(id);
        await loadProperties();
        await renderDashboard();
    } catch (err) {
        alert('Silme hatası: ' + err.message);
    }
}

// ─── Seksiyon Değiştir ───────────────────────────────────────────────────────
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const sec = document.getElementById(sectionId);
    if (sec) sec.style.display = 'block';

    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.sidebar-menu a[onclick*="${sectionId}"]`);
    if (link) link.classList.add('active');
}

// ─── Çıkış ───────────────────────────────────────────────────────────────────
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
}
