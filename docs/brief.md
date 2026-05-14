# Project Brief: RetroFlow

> Hackathon: Turkcell AI Hackathon — 14 Mayıs 2026
> Team: No Context No Cry (Gizem, Reha, Kübra, Naz)
> Last Updated: 14 Mayıs 2026

---

## Problem Statement

Yazılım ekipleri retrospektif toplantılarını Miro, Google Docs veya fiziksel sticky notlar gibi dış araçlarda yapıyor. Bu araçlar retro sürecine uygun olsa da toplantı sonunda alınan aksiyon maddeleri hiçbir takip sistemine bağlanmıyor. Aksiyonlar e-posta zincirlerine ya da kişisel notlara düşüyor; sprint ilerledikçe unutuluyor. Bir sonraki retroda "bunu yapmıştık mı?" sorusu yanıtsız kalıyor ve aynı problemler tekrar gündeme geliyor. Mevcut proje yönetim araçları (Jira, Trello) aksiyon takibine uygun ama retro sürecine entegre değil — iki araç arasındaki uçurum kapanmıyor.

---

## Proposed Solution

RetroFlow; retro toplantısını yönetmek, aksiyonları otomatik oluşturmak ve sprint boyunca takip etmek için tasarlanmış AI destekli entegre bir platformdur. Ekip üyeleri anonim olarak sticky not yazar, timer dolunca notlar ortaya çıkar, AI benzer olanları kümeler. Moderatör her küme için AI'ın önerdiği aksiyon taslağını düzenler ve onaylar. Her aksiyon Mail veya Jira kanalına yönlendirilerek atanır. Deadline gelince kişi uygulamaya girmeden maildeki butonla durumu günceller. Bir sonraki retro açılırken geçen dönemin özeti otomatik ekrana gelir — hiçbir aksiyon unutulmaz.

---

## Target Users

**Primary User:** 5–20 kişilik yazılım/ürün ekiplerinde Scrum Master veya takım lideri — retro toplantısını yöneten, aksiyonların takibinden sorumlu olan kişi.

**Secondary User:** Ekip üyeleri — retroya katılan, aksiyonları üstlenen ve deadline yaklaşınca mail alan yazılım geliştiriciler ve ürün ekibi çalışanları.

---

## MVP Features (Hackathon Scope)

Bu özellikler demo için çalışır durumda olmalıdır:

1. **Anonim Retro Board (Timer'lı)** — Mad/Sad/Glad şablonunda sticky not yazma; süre moderatör tarafından ayarlanır, timer dolunca notlar herkese açılır; tüm süreç anonimdir.

2. **AI Gruplama + Dot Voting** — Timer bittikten sonra AI benzer notları otomatik kümeler ve başlık önerir; ekip üyeleri sınırlı sayıda oy kullanır, en çok oy alan temalar öne çıkar.

3. **AI Aksiyon Önerisi (Editlenebilir)** — Her küme için AI kişiselleştirilmiş aksiyon taslağı üretir; moderatör düzenleyebilir, onaylayabilir veya silebilir; onaylanan aksiyona sahip + deadline + tip (Mail/Jira) atanır.

4. **İki Kanallı Aksiyon Teslimi**
   - **Mail:** AI tarafından yazılmış, eğlenceli ve görsel HTML mail şablonu ile atama bildirimi gönderilir (Resend API).
   - **Jira:** API Token yöntemiyle Jira'ya ticket açılır, `label: retro` ile etiketlenir; uygulama içinde ticket linki ve durumu gösterilir.

5. **Deadline Durum Sorgulama Maili** — Deadline dolduğunda kişiye mail gider; [✅ Tamamladım] [🔄 Devam ediyor] [❌ Yapılamadı] butonları magic link ile çalışır, login gerektirmez, aksiyon durumu otomatik güncellenir.

6. **Retro Öncesi Ekip Özet Maili** — Yeni retro planlandığında tüm ekibe AI üretimli özet mail gider: tamamlanan/açık/yapılamayan aksiyonların listesiyle.

7. **İlk Açılış — Retro Hafızası Ekranı** — Uygulama açıldığında veya yeni retro oluşturulurken geçen retrodan kalan tüm aksiyonlar statüsleriyle gösterilir; "Yapılamadı" olanlar bu retroya otomatik taşınmış gelir.

---

## Out of Scope (bu hackathon)

- Slack / Teams entegrasyonu
- Jira OAuth (şu an API Token ile çalışılıyor)
- Analitik dashboard (kapatma oranı, ekip sağlık skoru, trend grafikleri)
- Public "hızlı güncelle" linki (magic link yeterli)
- Sektör benchmark
- Mobil uygulama
- Çoklu retro şablonu (bu hackathon: sadece Mad/Sad/Glad)
- Gerçek zamanlı çok kullanıcılı senkronizasyon (WebSocket) — polling yeterli

---

## Success Criteria

Demo'da "done" şunları kapsar:

- [ ] Bir moderatör retro oluşturabilir, timer başlatabilir
- [ ] Ekip üyeleri anonim sticky not yazabilir
- [ ] Timer dolunca notlar açılır, AI kümelendirme çalışır
- [ ] Dot voting yapılır, en çok oy alan küme öne çıkar
- [ ] AI aksiyon taslağı üretir, moderatör düzenler ve onaylar
- [ ] Mail tipi aksiyonda atama maili gönderilir (AI üretimli, görsel)
- [ ] Jira tipi aksiyonda Jira'da ticket açılır
- [ ] Deadline dolunca durum sorgulama maili gelir, butona basınca güncellenir
- [ ] Yeni retro açılırken geçen retrodan kalan aksiyonlar ekranda görünür

---

## Constraints

| Constraint | Detail |
|------------|--------|
| Zaman | ~2 saat (hackathon) |
| Takım | 2 FE Dev (Gizem, Reha), 1 Analyst (Kübra), 1 UI/UX (Naz) |
| Tech | Next.js + MongoDB + Firebase Auth (mevcut template) |
| AI | OpenAI API (gruplama + aksiyon önerisi + mail içeriği) |
| Mail | Resend API |
| Jira | REST API v3 + API Token |
| Öncelik | Çalışan demo > mükemmel kod |

---

## Risks & Open Questions

| Risk / Soru | Etki | Azaltma |
|-------------|------|---------|
| OpenAI API gecikmesi retro akışını yavaşlatır | Orta | Gruplama ve aksiyon önerisi async — kullanıcı beklerken spinner gösterilir |
| Jira API Token kurulumu demo sırasında hata verebilir | Yüksek | Demo öncesi test edilmiş bir token hazır tutulur |
| Magic link güvenliği — token süresi dolmadan kötüye kullanım | Düşük | Token 48 saat geçerli, tek kullanımlık |
| 2 saatte tüm scope yetişmeyebilir | Yüksek | Öncelik sırası: Board → Aksiyon → Mail → Jira; Jira son sıraya alınır |
| Gerçek zamanlı senkronizasyon — birden fazla kullanıcı aynı anda not yazıyor | Orta | MVP'de polling (5 sn) yeterli, WebSocket roadmap'e alındı |
