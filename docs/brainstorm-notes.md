# Brainstorm Notes — RetroMind

**Tarih:** 14 Mayıs 2026  
**Oturum Süresi:** ~25 dakika  
**Konu:** Retro & Action Tracker

---

## Problem Frame

**Problem:**
Ekipler retrospektif toplantılarını dış platformlarda (Miro, sticky notes, Google Docs vb.) yapıyor; toplantıda alınan aksiyon maddeleri hiçbir sisteme bağlanmadığı için sonraki sprint başlamadan unutuluyor.

**Hedef Kullanıcı:**
5–20 kişilik yazılım/ürün ekiplerinde Scrum Master veya takım lideri rolündeki kişiler.

**Mevcut Çözümlerin Yetersizliği:**
Jira/Trello gibi araçlar aksiyon takibine uygun ama retro sürecine entegre değil. Miro/FunRetro retroya uygun ama aksiyon takibi yok. İki araç arasındaki uçurum kapanmıyor.

**Başarı Tanımı:**
Bir ekip retrodan çıkıp aynı platformda aksiyon maddelerini atayabiliyor, takip edebiliyor ve bir sonraki retroda "bunu yaptık mı?" sorusuna yanıt verebiliyor.

---

## Onaylanan Fikirler

| ID | Fikir |
|----|-------|
| WI-1 | Her sticky note tek tıkla aksiyona dönüşür — sahip + deadline ataması platform içinde yapılır |
| WI-2 | AI retroyu analiz eder, tekrar eden şikayetleri tespit eder ve önceki aksiyonlarla karşılaştırır |
| WI-4 | Retro şablonu dinamik — önceki bitmemiş aksiyonlar bir sonraki retroya otomatik taşınır |
| WI-5 | Asenkron retro desteği — herkes async sticky not bırakır, AI benzer olanları kümeler |
| RI-2 | Uygulama içi Team Board — sprint boyunca tüm açık aksiyonlar görünür, gizlenemez |

---

## Seçilen Konsept

```
CONCEPT: RetroMind — Retro'dan Aksiyona, Aksiyondan Öğrenmeye

Problem:
  Ekipler retroları dış araçlarda yapıyor; alınan aksiyonlar takip
  edilmiyor, bir sonraki retroya taşınmıyor ve unutuluyor.

Target User:
  5–20 kişilik yazılım/ürün ekiplerinde Scrum Master veya
  takım lideri rolündeki kişiler.

Solution:
  Retro toplantısını yürüten, aksiyonları otomatik oluşturan,
  sprint boyunca takip eden ve bir sonraki retroya "bitmemiş
  işleri" bellek olarak taşıyan AI destekli entegre platform.
```

---

## MVP Kapsam (2 Saatlik Hedef)

### Core Özellikler

1. **Retro Board** — 3 aşamalı akış:
   - **Aşama 1 — Yazma (Anonim + Timer):**
     - Herkes anonim olarak sticky not yazar (isimler gizlenir)
     - Moderatör tarafından ayarlanabilir geri sayım timer'ı (ör. 5 dk)
     - Timer dolunca yazma aşaması kapanır, notlar ortaya çıkar
   - **Aşama 2 — Gruplama:**
     - Manuel: Moderatör kartları sürükleyerek gruplar, gruba isim verir
     - AI ile Grupla: AI benzer notları otomatik kümeler ve başlık önerir
   - **Aşama 3 — Oylama:**
     - Her katılımcı belirli sayıda oy (dot voting) kullanır
     - En çok oy alan notlar/gruplar öne çıkar
     - Oylama da anonimdir
   - **Aşama 4 — AI Aksiyon Önerisi:**
     - Her küme için AI otomatik aksiyon taslağı üretir
     - Editlenebilir, onaylanabilir veya silinebilir
     - Onaylanan aksiyon sahip + deadline + tip (Mail/Jira) atanarak oluşturulur
2. **Aksiyona Çevir** — Sticky notu tek tıkla aksiyona dönüştür, sahip + deadline ata
3. **Aksiyon Tipi Seçimi** — Her aksiyon için iki tip:
   - **Mail**: Atama ve deadline hatırlatması e-posta ile gönderilir (Resend, ~20 dk)
   - **Jira**: Jira'ya ticket olarak düşer, `label: retro` ile etiketlenir (API Token yöntemi, ~45 dk)
4. **Team Board** — Uygulama içi açık aksiyon listesi, sprint boyunca görünür
5. **Retro Başlangıcı Uyarısı** — Yeni retro açılırken "Geçen retrodan X aksiyon hâlâ açık" ekranı

### Bildirim Stratejisi

| Kanal | Yöntem | Tetikleyici |
|-------|--------|-------------|
| E-posta | Resend API | Aksiyon atandığında + deadline yaklaşınca + retro öncesi |
| Jira | REST API + API Token | Aksiyon tipi "Jira" seçildiğinde |

### Mail İçeriği — AI + Görsel

Tüm mailler AI tarafından üretilir. İçerik:
- Kişiselleştirilmiş ve bağlamlı: aksiyonun retrodan neden çıktığını, kaç oy aldığını, kaçıncı sprinte taşındığını bilir
- Eğlenceli ton: emoji, motivasyon cümlesi, hafif mizah
- Görsel HTML mail şablonu: renkli başlık, aksiyon kartı, CTA buton

**Mail 1 — Atama Bildirimi (AI üretir):**
> "Merhaba Ahmet 👋 Geçen retroda CI/CD sorunları 5 oyla en çok gündem olan tema oldu. Sana atanan görev: *Pipeline cache ekle.* Ekibin bu konuyu 2 retrodur konuşuyor — bu sefer bitirelim 💪 Deadline: 20 Mayıs"

**Mail 2 — Deadline Durum Sorgulama:**
Deadline dolduğunda mail gelir, uygulamaya girmeden butonla güncellenir:
- [✅ Tamamladım] → Aksiyon otomatik "Done" olur
- [🔄 Devam ediyor] → Yeni deadline seç
- [❌ Yapılamadı] → Sebep yaz (bir sonraki retroya taşınır)

Butonlar tokenized magic link ile çalışır — login gerektirmez, tıkla güncellenir.

**Mail 3 — Retro Öncesi Ekip Özeti (AI üretir):**
Retro planlandığında tüm ekibe gönderilir:
> "Yarın retro var 🔍 Geçen sprint özeti: ✅ 3 tamamlandı / ⏳ 2 açık / ❌ 1 yapılamadı. Açık aksiyonlar: Deploy, Code Review. Retroya hazır mısınız?"

### Jira Entegrasyon Detayı

- OAuth yerine **API Token** (kullanıcı kendi token'ını girer — 15 dk implementasyon)
- Kullanıcı: Jira domain + API token + proje key girer
- Aksiyon oluşturulunca `POST /rest/api/3/issue` ile ticket açılır
- Uygulamamızda ticket linki ve durumu gösterilir
- Jira board'unda `label: retro` ile filtre edilebilir
- Jira aksiyonu oluşturulurken AI ticket açıklamasını da yazar

### İlk Açılış Ekranı — Retro Hafızası

Kullanıcı uygulamaya girdiğinde veya yeni retro oluştururken açılır:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Geçen Retrodan Kalan Aksiyonlar                │
│                                                     │
│  ✅ Pipeline cache eklendi        — Ahmet  DONE     │
│  ⏳ Code review süreci kısaltıldı — Zeynep OPEN     │
│  ❌ Test coverage artırıldı       — Mehmet FAILED   │
│                                                     │
│  [Retroya Başla]   [Açık Aksiyonları Gözden Geçir] │
└─────────────────────────────────────────────────────┘
```

- Tüm sprint geçmişi görünür
- "Failed" olanlar otomatik bu retroya taşınmış olarak işaretlenir
- Retroyu başlatmadan önce ekip son durumu görmek zorunda kalır

---

## Roadmap (Kapsam Dışı)

- Slack / Teams entegrasyonu
- Jira OAuth (şu an API Token)
- AI aksiyon önerisi (sticky nottan otomatik aksiyon taslağı)
- Analitik dashboard (kapatma oranı, tekrar eden temalar)
- Public "hızlı güncelle" linki (login gerektirmez)
- SCAMPER/RICE oylaması
- Sektör benchmark

---

## Kısıtlar

- **Zaman:** ~2 saat
- **Takım:** Küçük ekip
- **Tech:** Next.js + MongoDB + Firebase Auth (mevcut template)
- **Öncelik:** Çalışan demo > mükemmel kod

---

## Sonraki Adım

**#2 analyst** subagent'ı başlat ve `*create-brief` komutu ile proje brief'ini oluştur.
