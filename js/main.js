// ─── Supabase Yapılandırması ──────────────────────────────────────────────────
const SUPABASE_URL  = 'https://bsddhbdtexrqphaxxtfo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZGRoYmR0ZXhycXBoYXh4dGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjUwMDUsImV4cCI6MjA5NTcwMTAwNX0.v_V72MrdaZHEurlaGHuA_QhROMJvlARWbWzALMTstd4';

const sbHeaders = {
    'apikey': SUPABASE_ANON,
    'Authorization': 'Bearer ' + SUPABASE_ANON,
    'Content-Type': 'application/json'
};

async function fetchProperties() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`,
        { headers: sbHeaders }
    );
    if (!res.ok) throw new Error('Supabase hatası: ' + res.status);
    return await res.json();
}

// ─── İlan Kartı HTML ─────────────────────────────────────────────────────────
function createPropertyCard(property) {
    const imageHtml = (property.images && property.images.length > 0)
        ? `<img src="${property.images[0]}" alt="${property.title}">`
        : `<div class="no-image">🏠</div>`;

    const badgeClass = property.type === 'satilik' ? 'badge-sale' : 'badge-rent';
    const badgeText  = property.type === 'satilik' ? 'Satılık' : 'Kiralık';

    const priceText = property.type === 'satilik'
        ? '₺' + Number(property.price).toLocaleString('tr-TR')
        : '₺' + Number(property.price).toLocaleString('tr-TR') + '/ay';

    const featuresHtml = property.features
        ? property.features.split('\n').slice(0, 3)
            .map(f => `<span>${f}</span>`).join('')
        : '';

    return `
        <div class="property-card" onclick="showPropertyDetails(${property.id})">
            <div class="property-image">
                ${imageHtml}
                <div class="property-badge ${badgeClass}">${badgeText}</div>
            </div>
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location">📍 ${property.location}</p>
                <div class="property-details">${featuresHtml}</div>
                <div class="property-price">${priceText}</div>
                <button class="property-button">Detayları Gör</button>
            </div>
        </div>`;
}

// ─── İlanları Yükle ──────────────────────────────────────────────────────────
let cachedProperties = [];

async function loadProperties() {
    const featuredContainer = document.getElementById('featuredPropertiesContainer');
    const allContainer      = document.getElementById('allPropertiesContainer');

    featuredContainer.innerHTML = '<div class="empty-state"><p>Yükleniyor...</p></div>';

    try {
        cachedProperties = await fetchProperties();
    } catch (err) {
        console.error(err);
        featuredContainer.innerHTML = '<div class="empty-state"><h3>Bağlantı hatası</h3><p>Lütfen sayfayı yenileyin.</p></div>';
        allContainer.innerHTML = '';
        return;
    }

    if (cachedProperties.length === 0) {
        featuredContainer.innerHTML = `
            <div class="empty-state">
                <h3>Henüz İlan Bulunmuyor</h3>
                <p>Admin panelinden yeni ilanlar ekleyebilirsiniz.</p>
            </div>`;
        allContainer.innerHTML = '';
        return;
    }

    featuredContainer.innerHTML = cachedProperties.slice(0, 6).map(createPropertyCard).join('');
    allContainer.innerHTML      = cachedProperties.map(createPropertyCard).join('');
}

// ─── İlan Detay Modal ────────────────────────────────────────────────────────
function showPropertyDetails(propertyId) {
    const property = cachedProperties.find(p => p.id === propertyId);
    if (!property) { alert('İlan bulunamadı!'); return; }

    const priceText = property.type === 'satilik'
        ? '₺' + Number(property.price).toLocaleString('tr-TR')
        : '₺' + Number(property.price).toLocaleString('tr-TR') + '/ay';

    const badgeBg   = property.type === 'satilik' ? '#e74c3c' : '#3498db';
    const badgeText = property.type === 'satilik' ? 'Satılık' : 'Kiralık';

    const imagesHtml = (property.images && property.images.length > 0) ? `
        <div style="margin:1.5rem 0;">
            <img src="${property.images[0]}" alt="${property.title}"
                style="width:100%;max-height:300px;object-fit:cover;border-radius:10px;">
        </div>
        <div style="margin:1rem 0;display:flex;gap:10px;overflow-x:auto;">
            ${property.images.map(url =>
                `<img src="${url}" alt="${property.title}"
                    style="width:120px;height:90px;object-fit:cover;border-radius:8px;flex-shrink:0;">`
            ).join('')}
        </div>` : '';

    const featuresHtml = property.features ? `
        <h3 style="color:#2c3e50;margin:1.5rem 0 1rem 0;">Özellikler</h3>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem;">
            ${property.features.split('\n').map(f =>
                `<span style="background:#ffd700;color:#2c3e50;padding:5px 10px;border-radius:15px;font-size:0.9rem;">${f}</span>`
            ).join('')}
        </div>` : '';

    document.getElementById('modal-body').innerHTML = `
        <h2>${property.title}</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0;flex-wrap:wrap;">
            <span style="background:${badgeBg};color:white;padding:5px 15px;border-radius:20px;font-weight:bold;">${badgeText}</span>
            <span style="font-size:1.5rem;font-weight:bold;color:#e67e22;">${priceText}</span>
        </div>
        <p style="color:#7f8c8d;margin-bottom:1rem;"><strong>📍 ${property.location}</strong></p>
        ${imagesHtml}
        ${featuresHtml}
        <div style="background:#2c3e50;color:white;padding:1.5rem;border-radius:10px;margin-top:2rem;">
            <h3 style="color:#ffd700;margin-bottom:1rem;">İletişim</h3>
            <p style="margin-bottom:0.5rem;"><strong>BGArsaOfisim</strong></p>
            <p style="margin-bottom:1rem;">📞 +90 532 784 33 30</p>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                <button onclick="window.location.href='tel:+905327843330'"
                    style="background:#ffd700;color:#2c3e50;border:none;padding:10px 20px;border-radius:5px;font-weight:bold;cursor:pointer;">
                    📞 Ara
                </button>
                <button onclick="closeModal();document.getElementById('iletisim').scrollIntoView({behavior:'smooth'})"
                    style="background:#27ae60;color:white;border:none;padding:10px 20px;border-radius:5px;font-weight:bold;cursor:pointer;">
                    💬 İletişim
                </button>
            </div>
        </div>`;

    document.getElementById('propertyModal').style.display = 'block';
}

// ─── Arama ───────────────────────────────────────────────────────────────────
function searchProperties() {
    const emlakTipi = document.getElementById('emlak-tipi').value;
    const islemTipi = document.getElementById('islem-tipi').value;
    const sehir     = document.getElementById('sehir').value;
    const minFiyat  = Number(document.getElementById('min-fiyat').value);
    const maxFiyat  = Number(document.getElementById('max-fiyat').value);

    const filtered = cachedProperties.filter(p => {
        const title = p.title.toLowerCase();
        const price = Number(p.price);
        let ok = true;

        if (emlakTipi) {
            if (emlakTipi === 'daire'   && !title.includes('daire'))   ok = false;
            if (emlakTipi === 'villa'   && !title.includes('villa'))    ok = false;
            if (emlakTipi === 'arsa'    && !title.includes('arsa'))     ok = false;
            if (emlakTipi === 'is-yeri' &&
                !title.includes('ofis') && !title.includes('iş') && !title.includes('mağaza')) ok = false;
        }
        if (islemTipi && p.type !== islemTipi) ok = false;
        if (sehir && !p.location.toLowerCase().includes(sehir.toLowerCase())) ok = false;
        if (minFiyat && price < minFiyat) ok = false;
        if (maxFiyat && price > maxFiyat) ok = false;
        return ok;
    });

    const featuredContainer = document.getElementById('featuredPropertiesContainer');
    const allContainer      = document.getElementById('allPropertiesContainer');

    if (filtered.length === 0) {
        featuredContainer.innerHTML = `
            <div class="empty-state">
                <h3>Arama Kriterlerinize Uygun İlan Bulunamadı</h3>
                <p>Farklı kriterler deneyebilirsiniz.</p>
            </div>`;
        allContainer.innerHTML = '';
    } else {
        featuredContainer.innerHTML = filtered.slice(0, 6).map(createPropertyCard).join('');
        allContainer.innerHTML      = filtered.map(createPropertyCard).join('');
    }

    document.getElementById('ilanlar').scrollIntoView({ behavior: 'smooth' });
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function closeModal() {
    document.getElementById('propertyModal').style.display = 'none';
}

// ─── Scroll Animasyonu ───────────────────────────────────────────────────────
function animateOnScroll() {
    document.querySelectorAll('.property-card, .service-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            card.style.opacity   = '1';
            card.style.transform = card.matches(':hover') ? 'translateY(-5px)' : 'translateY(0)';
        }
    });
}

// ─── DOMContentLoaded ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadProperties();

    document.querySelectorAll('.property-card, .service-card').forEach(card => {
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
    });

    document.getElementById('showAllButton').addEventListener('click', function () {
        const section  = document.getElementById('allPropertiesSection');
        const expanded = section.classList.toggle('show');
        this.textContent = expanded ? 'Daha Az Göster' : 'Tümü';
    });

    document.querySelector('.close').onclick = closeModal;
    window.onclick = e => {
        if (e.target === document.getElementById('propertyModal')) closeModal();
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.querySelector('.mobile-menu').addEventListener('click', function () {
        const nl = document.querySelector('.nav-links');
        nl.style.display = nl.style.display === 'flex' ? 'none' : 'flex';
    });
});

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load',   animateOnScroll);
