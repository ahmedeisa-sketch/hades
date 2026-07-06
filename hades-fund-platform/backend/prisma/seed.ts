import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@hadesfund.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'System Administrator',
        role: UserRole.SUPER_ADMIN,
      },
    });
    console.log(`Seeded Super Admin: ${adminEmail} / ChangeMe123! (change immediately)`);
  }

  const existingFund = await prisma.fund.findFirst({ where: { name: 'Hades Fund I' } });
  if (!existingFund) {
    await prisma.fund.create({
      data: {
        name: 'Hades Fund I',
        baseCurrency: 'AED',
        managementFeePct: 2.0,
        performanceFeePct: 20.0,
        lockupMonths: 12,
        noticeDays: 30,
      },
    });
    console.log('Seeded default fund: Hades Fund I');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
