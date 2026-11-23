"use client";

import { LoginScreen } from "@/components/LoginScreen";
import { MascotLoader } from "@/components/MascotLoader";
import { Toast } from "@/components/Toast";

export default function HomePage() {
  return (
    <>
      <MascotLoader />
      <LoginScreen />
      <Toast />
    </>
  );
}
