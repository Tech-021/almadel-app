require("dotenv").config();

const bcrypt = require("bcryptjs");

const { prisma } = require("./db");

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    create: {
      email,
      fullName,
      passwordHash,
      role: "admin",
    },
    update: {
      fullName,
      passwordHash,
      role: "admin",
    },
    where: { email },
  });

  console.log(`Admin ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
