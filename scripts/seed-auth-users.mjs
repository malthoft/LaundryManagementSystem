#!/usr/bin/env node
/**
 * JoyOps: membuat akun karyawan di Supabase Auth.
 *
 * Jalur utama pembuatan akun. Memakai auth.admin.createUser() sehingga
 * Supabase yang menyusun baris auth.users dan auth.identities dengan benar.
 * Trigger handle_new_user() di database akan membuat baris `profiles`.
 *
 * Pakai:
 *   node scripts/seed-auth-users.mjs
 *
 * Env yang dibutuhkan (dibaca dari .env.local, atau dari lingkungan):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   AUTH_EMAIL_DOMAIN      (opsional, default joyops.local)
 *   SEED_TEMP_PASSWORD     (opsional, default JoyOps#2026)
 *
 * Peringatan: script ini memakai service role key. Jalankan hanya dari mesin
 * sendiri. Jangan pernah dijalankan di browser atau di serverless function.
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- muat .env.local tanpa dependensi tambahan -------------------------------
function muatEnv(berkas = ".env.local") {
  if (!existsSync(berkas)) return;
  for (const baris of readFileSync(berkas, "utf8").split(/\r?\n/)) {
    const bersih = baris.trim();
    if (!bersih || bersih.startsWith("#")) continue;
    const pisah = bersih.indexOf("=");
    if (pisah === -1) continue;
    const kunci = bersih.slice(0, pisah).trim();
    let nilai = bersih.slice(pisah + 1).trim();
    if (
      (nilai.startsWith('"') && nilai.endsWith('"')) ||
      (nilai.startsWith("'") && nilai.endsWith("'"))
    ) {
      nilai = nilai.slice(1, -1);
    }
    if (!(kunci in process.env)) process.env[kunci] = nilai;
  }
}

muatEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.AUTH_EMAIL_DOMAIN || "joyops.local";
const sandiSementara = process.env.SEED_TEMP_PASSWORD || "JoyOps#2026";

if (!url || !serviceKey) {
  console.error(
    "Gagal: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus terisi di .env.local"
  );
  process.exit(1);
}

// --- daftar akun ------------------------------------------------------------
// Ubah daftar ini sesuai kebutuhan toko. `username` dipakai untuk login.
const AKUN = [
  { username: "althof123", fullName: "Althof Taqiyyuddin", role: "Admin" },
  { username: "damar", fullName: "Damar Galih", role: "Karyawan" },
  { username: "adnan", fullName: "Adnan Amhar", role: "Karyawan" },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function emailUntuk(username) {
  return `${username}@${domain}`;
}

async function cariUserByEmail(email) {
  // Halaman 1 cukup untuk instalasi toko. Naikkan perPage kalau akun banyak.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Gagal membaca daftar user: ${error.message}`);
  return data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || null;
}

async function jalankan() {
  let dibuat = 0;
  let dilewati = 0;
  const ringkasan = [];

  for (const akun of AKUN) {
    const email = emailUntuk(akun.username);
    const ada = await cariUserByEmail(email);

    if (ada) {
      // Peran disamakan dengan daftar di atas, tanpa menyentuh sandi.
      const { error } = await admin
        .from("profiles")
        .update({ full_name: akun.fullName, role: akun.role })
        .eq("id", ada.id);
      if (error) {
        console.error(`  ! ${akun.username}: gagal menyamakan profil - ${error.message}`);
      }
      dilewati += 1;
      ringkasan.push(`  = ${akun.username.padEnd(12)} ${akun.role.padEnd(9)} sudah ada`);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: sandiSementara,
      email_confirm: true,
      user_metadata: {
        username: akun.username,
        full_name: akun.fullName,
        role: akun.role,
      },
    });

    if (error) {
      console.error(`  ! ${akun.username}: ${error.message}`);
      continue;
    }

    dibuat += 1;
    ringkasan.push(
      `  + ${akun.username.padEnd(12)} ${akun.role.padEnd(9)} ${data.user.id}`
    );
  }

  console.log("\nAkun JoyOps\n" + "-".repeat(60));
  console.log(ringkasan.join("\n"));
  console.log("-".repeat(60));
  console.log(`Dibuat: ${dibuat}   Sudah ada: ${dilewati}`);
  console.log(`Domain email: ${domain}`);
  if (dibuat > 0) {
    console.log(
      `\nSandi sementara semua akun baru: ${sandiSementara}\n` +
        "Ganti setelah login pertama. Jangan simpan sandi asli di berkas yang masuk git."
    );
  }
  console.log("");
}

jalankan().catch((e) => {
  console.error("Gagal:", e.message);
  process.exit(1);
});
