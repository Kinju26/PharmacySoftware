"use client";

import { LoginScreen } from "@/components/LoginScreen";
import { MascotLoader } from "@/components/MascotLoader";

export default function HomePage() {
  return (
    <>
      <MascotLoader />
      <LoginScreen />
    </>
  );
}
