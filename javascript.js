const pasaran = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];
const dina = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const neptuDina = [5, 4, 3, 7, 8, 6, 9];
const neptuPasaran = [5, 9, 8, 7, 7];
let jadwalSholat = {};

function getDayNumber(date) {
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

function getWeton(date) {
  const dayNumber = getDayNumber(date);
  const indexDina = date.getDay();
  const indexPasaran = (dayNumber + 4) % 5;
  return {
    dina: dina[indexDina],
    pasaran: pasaran[indexPasaran],
    neptuDina: neptuDina[indexDina],
    neptuPasaran: neptuPasaran[indexPasaran]
  };
}

function updateDisplay() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  document.getElementById('currentDate').textContent = formattedDate;

  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');

  document.getElementById('hour').textContent = h;
  document.getElementById('minute').textContent = m;
  document.getElementById('second').textContent = s;
  document.getElementById('millisecond').textContent = ms;

  const maghribHour = 17, maghribMinute = 30;
  let displayWeton = "";
  if (now.getHours() > maghribHour || (now.getHours() === maghribHour && now.getMinutes() >= maghribMinute)) {
    const tomorrow = new Date(now.getTime() + 86400000);
    const w = getWeton(tomorrow);
    displayWeton = `Malam ${w.dina} ${w.pasaran}`;
  } else {
    const w = getWeton(now);
    displayWeton = `${w.dina} ${w.pasaran}`;
  }
  document.getElementById('currentWeton').textContent = displayWeton;
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      fetchJadwalSholat(lat, lon);
      fetchKota(lat, lon);
    }, err => {
      console.warn("Gagal ambil lokasi, pakai default Jakarta.");
      fetchJadwalSholat(-6.2, 106.8);
      document.getElementById('locationInfo').textContent = "Lokasi: Jakarta";
    });
  } else {
    console.warn("Geolocation tidak didukung.");
    fetchJadwalSholat(-6.2, 106.8);
    document.getElementById('locationInfo').textContent = "Lokasi: Surakarta";
  }
}

function fetchJadwalSholat(lat, lon) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      jadwalSholat = data.data.timings;
    })
    .catch(err => console.error("Gagal ambil jadwal:", err));
}

function fetchKota(lat, lon) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(res => res.json())
    .then(data => {
      const kota = data.address.city || data.address.town || data.address.village || "Tidak Diketahui";
      document.getElementById('locationInfo').textContent = `Lokasi: ${kota}`;
    })
    .catch(err => {
      document.getElementById('locationInfo').textContent = "Lokasi: Tidak diketahui";
    });
}

function getNextPrayerTime() {
  const now = new Date();
  const today = new Date().toISOString().split('T')[0];
  const keys = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  for (let key of keys) {
    const [hour, minute] = jadwalSholat[key].split(":");
    const prayerTime = new Date(`${today}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`);
    if (now < prayerTime) {
      return { name: key, time: prayerTime };
    }
  }

  const [hour, minute] = jadwalSholat["Fajr"].split(":");
  const nextDay = new Date(now.getTime() + 86400000);
  const besok = new Date(`${nextDay.toISOString().split('T')[0]}T${hour}:${minute}:00`);
  return { name: "Fajr", time: besok };
}

function updateSholatCountdown() {
  if (!jadwalSholat["Fajr"]) return;

  const now = new Date();
  const next = getNextPrayerTime();
  const diff = next.time - now;

  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

  document.getElementById("prayerCountdown").textContent =
    `Menuju ${next.name}: ${h}:${m}:${s}`;
}

getUserLocation();
setInterval(() => {
  updateDisplay();
  updateSholatCountdown();
}, 50);
console.log(jadwalSholat); // Cek data jadwal sholat
