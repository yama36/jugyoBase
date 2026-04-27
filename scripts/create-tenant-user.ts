/**
 * テナントとユーザーを手動作成する CLI。
 *
 * 例:
 *   DATABASE_URL=... npx tsx scripts/create-tenant-user.ts --slug demo --name "デモ小学校" --email you@gmail.com
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

async function main() {
  const slug = arg("--slug");
  const name = arg("--name");
  const email = arg("--email")?.toLowerCase().trim();
  const domainArg = arg("--domain")?.toLowerCase().trim();

  if (!slug || !name || !email) {
    console.error(
      "Usage: npx tsx scripts/create-tenant-user.ts --slug <slug> --name <学校名> --email <googleメール> [--domain <hosted-domain>]",
    );
    process.exit(1);
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    create: {
      id: randomUUID(),
      name,
      slug,
      googleHostedDomain: domainArg || null,
    },
    update: {
      name,
      googleHostedDomain: domainArg || null,
    },
  });

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: email.split("@")[0],
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
    update: {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
  });

  console.log("OK:", {
    tenantId: tenant.id,
    slug: tenant.slug,
    email,
    googleHostedDomain: tenant.googleHostedDomain,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
