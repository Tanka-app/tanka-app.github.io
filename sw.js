// TanKa — เก็บตัวแอปไว้ในเครื่อง ให้เปิดได้ตอนไม่มีเน็ต
// ตัวแอป (index.html): ลองเน็ตก่อน (ได้เวอร์ชันใหม่เสมอ) ถ้าไม่มีเน็ตใช้ตัวที่เก็บไว้
// ไลบรารีจาก CDN (ล็อกเวอร์ชันแล้ว): ใช้ตัวที่เก็บไว้ก่อน · ข้อมูล Supabase: ไม่ผ่านตัวนี้ (แอปจัดการเอง)
const V = 'tanka-v2';
const CDN = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(['./', ...CDN].map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.hostname.endsWith('supabase.co')) return;
  const page = req.mode === 'navigate' || (u.origin === location.origin && (u.pathname.endsWith('/') || u.pathname.endsWith('.html')));
  if (page) {
    e.respondWith(timeout(fetch(req), 5000).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('./', c)); return r; })
      .catch(() => caches.match('./').then(r => r || caches.match(req))));
    return;
  }
  if (/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); return r; })));
  }
});
