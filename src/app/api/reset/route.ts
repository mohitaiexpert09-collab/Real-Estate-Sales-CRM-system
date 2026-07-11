import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seeder";

export async function POST() {
  await seedDatabase();
  return NextResponse.json({ ok: true });
}
