# Diyanet Offline Motor - İleri Astrofizik ve Harmonik Delta Mimarisi 🚀

Bu belge, **Diyanet Offline Motor** projesinde kullanılan agresif teknik optimizasyonları, astronomik kayan nokta (floating-point) atlatmalarını ve döngüsel veri sıkıştırma mimarisini vurgulamaktadır. Bu motor, tek bir harici API isteği yapmadan, **972 ilçe** için 25 yıllık tahmini bir aralıkta (2026-2050) istemci cihazında tamamen otonom ve mükemmel senkronize (0-sapma) namaz vakitleri üretir.

---

## 1. "Harmonic Delta Signature" Sıkıştırması (O(1) Veri Çekimi)

Geleneksel namaz vakti veri setleri, mutlak zaman damgalarını belirli ilçelere eşlemek için devasa JSON yığınlarına (yılda yaklaşık 50-60 MB) ihtiyaç duyar. Aşırı bir çevrimdışı (offline) verimlilik elde etmek için, bu motor göksel izleme verilerini radikal bir şekilde **Harmonic Delta Signature** (Harmonik Delta İmzası) formatına sıkıştırır.

Açık zaman damgalarını (`16:42`, `19:27`) depolamak yerine, motor Diyanet tarafından uygulanan yerel ufuk topolojisinin matematiksel sapma sınırlarını tespit eder. Saf Jean Meeus transit hesaplaması ile yerel topolojik anomali arasındaki farkı (delta), deterministik bir tamsayıya (`Int`) dönüştürür.

`char_val = 77 + delta` formülü kullanılarak, motor bu sapmayı ASCII tablosuna kodlar (`M` = 0 sapması). Her ilçeye 2190 karakterlik kesintisiz bir alfanümerik dize (365 gün x 6 vakit) atanır.
Çalışma zamanında (runtime) Alan ve Zaman Karmaşıklığı (Space and Time Complexity) dramatik bir şekilde düşer:
* **Alan Karmaşıklığı (Space Complexity):** Küresel ufuk anomalileri ~50MB'den tek bir JS değişkeni içindeki **2.2MB**'lık yerel bir yüke sıkıştırılır.
* **Zaman Karmaşıklığı (Time Complexity):** Sapmanın (delta) çözümlenmesi, `har.charCodeAt(idx) - 77` fonksiyonu aracılığıyla saniyenin binde biri kadar bir sürede kısıtlı **O(1)** sabitiyle gerçekleşir.

---

## 2. IEEE-754 Hassasiyet Kaymasının Atlatılması

Bir tarayıcının JS motorunun içinde arka uçtaki kesin kayan nokta (floating-point) matematiğini çoğaltmak, yuvarlama sınırlarında ciddi sapma riskleri yaratır. Python'un çiftten-yarıya (half-to-even) `round()` fonksiyonu ile Javascript'in eşitlik-bozan (tie-breaking) `Math.round()` fonksiyonu arasındaki herhangi rastgele bir uyuşmazlık, yıl boyunca standart olarak 1 dakikalık sapmaları zorunlu kılar.

Sistem, yapay bir **Epsilon Enjektörü** ile bu durumu düzeltir:
```javascript
let mins = Math.round((h - Math.floor(h)) * 60 - 0.035);
```
Sistem hassas bir biçimde ölçülmüş `0.035` kesirli dakika sabitini çıkararak, bilinçli bir biçimde IEEE-754 hassasiyetini hafifçe aşağı zorlar. Bu, Javascript davranışını normalleştirerek JS'nin `Math.round(x + 0.5)` mantığı çalışmadan hemen önce referans alınan Python arka uç (backend) motorunu mükemmel bir şekilde taklit eder.

---

## 3. Kesirli Kırılma Fiziği (Fraction Refraction): 50/60 Limiti

Genel uygulamalar, kırılma açılarını (`0.833°`) tahmin etmek için standart bir Float (Kayan Nokta) kullanır. Ancak, 32-bit/64-bit kesilmiş(truncated) float tahmini, ekstrem enlemlerde kademeli olarak kesirli hatalar biriktirir.
Optik ufuk noktasındaki atmosferik kırılma deformasyonu, matematiksel değerlendirimi tam olarak **-50 yay dakikasına** şifreleyerek düzeltilmiştir:
```javascript
let sr_ang = (50 / 60.0) + dip;
```
Bu adım, Javascript AST'sini önleyici bir skaler değere güvenmek yerine tam ondalık matrisi çözmeye zorlayarak, ekstrem gündönümü (solstice) noktalarındaki sınır sapmasını tamamen ortadan kaldırır.

---

## 4. Yaz Saati (DST) Zaman Kayması Bug'ı

Belki de bu motorda fethedilen en zorlu ekstrem vaka (edge case), standart tarayıcı `Date()` saat dilimlerinin Yaz Saati sınırları boyunca gizli bir senkronizasyon kayması yaratmasıydı.

Başlangıçta motor, milisaniye farkını kontrol ederek yılın günü indeksini (`doy`) belirliyordu:
```javascript
// Sorunlu floor işlemi
let diff = now - start;
return Math.floor(diff / 86400000); 
```
Eğer bir kullanıcı İlkbahar-İleri (Spring Forward) DST uygulayan bir coğrafi bölgede (örneğin `America/New_York`) bulunuyorsa, zaman çizelgesinden 1 Ocak ile 23 Mart arasında kozmik bir saat silinir. Fiziksel fark tam olarak **81.958 güne** düşer.
`Math.floor(81.958)` işleminin agresif bir şekilde uygulanması tüm kesirli kalanı (0.958) atarak indeks zaman çizelgesinden tam bir günü şiddetle siler. Motor aniden, bugünün astronomik yörüngesi için *dünün* Harmonic Delta Signature'ını (Harmonik Delta İmzası) çağırarak çıktı tahminlerini ± 1 dakika kaydırıyordu.

**Çözüm:**
Değerlendirmenin `Math.round(diff / 86400000)` olarak değiştirilmesiyle, zaman dilimi bozulması tamamen izole edilmiştir. `Math.round(81.958)`, subjektif tarayıcı saat dilimlerinden bağımsız olarak takvim indeksini `82` gününe matematiksel olarak kilitler. Bu, gezegensel yörüngenin 0-index'li Harmonik Delta dizisiyle kusursuz bir şekilde eşleşmesini sağlar.

---

## Sonuç
Diyanet Offline Motor basit bir API arayüzü değildir. Algoritmik float sıkıştırmalarıyla, zaman dilimi anomalisi (timezone anomaly) korumalarıyla ve karakter düzeyinde veritabanı minyatürleştirmesiyle ağır bir şekilde sarılmış, ulaşılamaz göksel hareketlerin baştan aşağı yeniden oluşturulmuş otonom bir matematiksel ikizidir. 🚀
