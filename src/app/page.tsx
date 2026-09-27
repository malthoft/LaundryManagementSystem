import { redirect } from "next/navigation";

/* Gerbang awal. Arahkan ke dashboard; (app)/layout.tsx yang memutuskan
   pengguna perlu login atau tidak. */
export default function Beranda() {
  redirect("/dashboard");
}
