// Standalone CLI runner for demo accounts seeding
import { seedDemoAccounts } from "../src/lib/seed/seed-auth";

async function main() {
  console.log("--------------------------------------------------");
  console.log("Starting Demo Accounts & Organization Seeding...");
  console.log("--------------------------------------------------");

  try {
    const result = await seedDemoAccounts();
    console.log(`[SUCCESS] ${result.message}\n`);
    console.log("Provisioned Demo Accounts:");
    for (const acc of result.accounts) {
      console.log(`  - Role: ${acc.role.padEnd(8)} | Email: ${acc.email.padEnd(30)} | DB ID: ${acc.dbId}`);
    }
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (error: unknown) {
    console.error("[ERROR] Seeding failed:", error);
    process.exit(1);
  }
}

main();
