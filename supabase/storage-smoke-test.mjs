import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const stamp = Date.now();

const { data: signUpData, error: signUpError } = await client.auth.signUp({
  email: `photo-test-${stamp}@example.com`,
  password: "test-password-123",
  options: { data: { name: "photo-test", role: "member" } },
});
if (signUpError) throw signUpError;

const userId = signUpData.user.id;
// 1x1 transparent PNG
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);
const path = `${userId}/test.png`;

const { error: uploadError } = await client.storage
  .from("mission-photos")
  .upload(path, pngBytes, { contentType: "image/png", upsert: true });

if (uploadError) {
  console.log("FAIL - upload:", uploadError.message);
  process.exit(1);
}
console.log("PASS - authenticated member can upload to own folder");

const { data: pub } = client.storage.from("mission-photos").getPublicUrl(path);
const res = await fetch(pub.publicUrl);
console.log(
  res.ok ? "PASS - uploaded photo is publicly fetchable" : `FAIL - public fetch status ${res.status}`
);

// Cross-user upload should be rejected
const { error: crossError } = await client.storage
  .from("mission-photos")
  .upload(`someone-else-id/test.png`, pngBytes, { contentType: "image/png", upsert: true });
console.log(
  crossError ? "PASS - upload into another user's folder is blocked" : "FAIL - cross-user upload was NOT blocked"
);

if (!res.ok || !crossError) process.exit(1);
