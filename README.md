# Telegram Admin Panel

Next.js ve Tailwind CSS kullanılarak geliştirilmiş Telegram bot admin paneli. Bu panel, Telegram API'si ile entegre olarak kullanıcı girişi, profil yönetimi, kanal/grup listesi ve zamanlanmış mesaj gönderme özelliklerini sunar.

## Özellikler

- ✅ **Kullanıcı Girişi**: Telegram API ile güvenli giriş sistemi
- ✅ **Profil Ekranı**: Kullanıcı bilgilerini görüntüleme ve güncelleme
- ✅ **Kanal ve Grup Listesi**: Kullanıcının katıldığı tüm kanal ve grupları listeleme
- ✅ **Zamanlanmış Mesaj Gönderme**: Cron tabanlı otomatik mesaj gönderme sistemi
- ✅ **Cron Yönetimi**: Zamanlanmış mesajları oluşturma, düzenleme, başlatma/durdurma ve silme
- ✅ **Local JSON Depolama**: Cron verilerini local JSON dosyasında saklama
- ✅ **Modern UI**: Tailwind CSS ile responsive ve modern arayüz

## Kurulum

1. **Projeyi klonlayın:**
   ```bash
   git clone <repository-url>
   cd telegram-admin-panel
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre değişkenlerini ayarlayın:**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` dosyasını düzenleyin ve Telegram API bilgilerinizi girin:
   ```env
   TELEGRAM_API_ID=your_api_id_here
   TELEGRAM_API_HASH=your_api_hash_here
   TELEGRAM_SESSION_PATH=./sessions
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

4. **Telegram API Bilgilerini Alın:**
   - [my.telegram.org/apps](https://my.telegram.org/apps) adresine gidin
   - Yeni bir uygulama oluşturun
   - API ID ve API Hash değerlerini alın
   - Bu değerleri `.env.local` dosyasına ekleyin

5. **Projeyi çalıştırın:**
   ```bash
   npm run dev
   ```

6. **Tarayıcıda açın:**
   ```
   http://localhost:3000
   ```

## Kullanım

### 1. Giriş Yapma
- Ana sayfada telefon numaranızı girin
- Telegram'dan gelen doğrulama kodunu girin
- 2FA aktifse şifrenizi girin

### 2. Profil Yönetimi
- Giriş yaptıktan sonra "Profile" sekmesinde bilgilerinizi görüntüleyin
- "Refresh Profile" butonu ile bilgileri güncelleyin

### 3. Kanal ve Grup Listesi
- "Chats & Groups" sekmesinde katıldığınız tüm kanal ve grupları görüntüleyin
- "Refresh" butonu ile listeyi güncelleyin

### 4. Zamanlanmış Mesaj Yönetimi
- "Scheduled Messages" sekmesinde zamanlanmış mesajlarınızı yönetin
- "Create New" butonu ile yeni zamanlanmış mesaj oluşturun
- Mevcut mesajları başlatın, durdurun veya silin

### Cron Expression Formatı
Zamanlanmış mesajlar için cron expression kullanın:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Haftanın günü (0-7, 0 ve 7 = Pazar)
│ │ │ └───── Ay (1-12)
│ │ └─────── Ayın günü (1-31)
│ └───────── Saat (0-23)
└─────────── Dakika (0-59)
```

**Örnekler:**
- `0 9 * * *` - Her gün saat 09:00'da
- `0 12 * * 1` - Her Pazartesi saat 12:00'da
- `30 18 * * 1-5` - Hafta içi her gün saat 18:30'da

## API Endpoints

### Telegram API
- `POST /api/telegram/auth` - Kullanıcı girişi
- `GET /api/telegram/user` - Kullanıcı bilgileri
- `GET /api/telegram/chats` - Kanal ve grup listesi
- `POST /api/telegram/send-message` - Mesaj gönderme

### Cron API
- `GET /api/cron` - Zamanlanmış mesaj listesi
- `POST /api/cron` - Yeni zamanlanmış mesaj oluşturma
- `GET /api/cron/[id]` - Belirli zamanlanmış mesaj
- `PUT /api/cron/[id]` - Zamanlanmış mesaj güncelleme
- `DELETE /api/cron/[id]` - Zamanlanmış mesaj silme
- `POST /api/cron/[id]/toggle` - Zamanlanmış mesaj başlatma/durdurma

## Proje Yapısı

```
src/
├── app/
│   ├── api/
│   │   ├── cron/           # Cron yönetimi API'leri
│   │   └── telegram/       # Telegram API'leri
│   ├── globals.css         # Global CSS
│   ├── layout.tsx          # Ana layout
│   └── page.tsx            # Ana sayfa
├── components/
│   ├── ChatsList.tsx       # Kanal/grup listesi
│   ├── CronManager.tsx     # Cron yönetimi
│   ├── Dashboard.tsx       # Ana dashboard
│   ├── LoginForm.tsx       # Giriş formu
│   └── Profile.tsx         # Profil ekranı
└── lib/
    ├── cron-manager.ts     # Cron yönetim servisi
    └── telegram.ts         # Telegram API servisi
```

## Veri Depolama

- **Cron Verileri**: `data/scheduled-messages.json` dosyasında saklanır
- **Session Verileri**: LocalStorage'da saklanır
- **Veritabanı**: Kullanılmaz, tüm veriler Telegram API'si ve local dosyalardan gelir

## Güvenlik

- API anahtarları çevre değişkenlerinde saklanır
- Session verileri güvenli şekilde yönetilir
- Telegram API'si üzerinden güvenli kimlik doğrulama

## Geliştirme

```bash
# Geliştirme modunda çalıştırma
npm run dev

# Production build
npm run build

# Production modunda çalıştırma
npm start

# Linting
npm run lint
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Destek

Herhangi bir sorun yaşarsanız, lütfen GitHub Issues bölümünde bir issue oluşturun.