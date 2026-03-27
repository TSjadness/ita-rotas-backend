// require("dotenv").config();
// const { PrismaClient } = require("@prisma/client");
// const { PrismaPg } = require("@prisma/adapter-pg");
// const { Pool } = require("pg");
// const bcrypt = require("bcryptjs");

// const connectionString = process.env.DATABASE_URL;

// const pool = new Pool({
//   connectionString,
// });

// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   const passwordHash = await bcrypt.hash("@itarota792026", 10);

//   const existing = await prisma.user.findUnique({
//     where: { username: "admin" },
//   });

//   if (existing) {
//     await prisma.user.update({
//       where: { username: "admin" },
//       data: {
//         passwordHash,
//         role: "admin",
//       },
//     });
//     console.log("Usuário admin atualizado com sucesso.");
//   } else {
//     await prisma.user.create({
//       data: {
//         username: "admin",
//         passwordHash,
//         role: "admin",
//       },
//     });
//     console.log("Usuário admin criado com sucesso.");
//   }
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//     await pool.end();
//   });
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("@itarota792026", 10);

  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    await prisma.user.update({
      where: { username: "admin" },
      data: {
        passwordHash,
        role: "admin",
      },
    });
    console.log("Usuário admin atualizado com sucesso.");
  } else {
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash,
        role: "admin",
      },
    });
    console.log("Usuário admin criado com sucesso.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });