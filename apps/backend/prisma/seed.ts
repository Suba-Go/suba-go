import { PrismaClient, UserRoleEnum, ItemStateEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- The Growth ---
  const tenantGrowth = await prisma.tenant.create({ data: {} });
  console.log('Created Tenant Growth:', tenantGrowth.id);

  const passwordGrowth = await bcrypt.hash('Password1.', 10);

  const companyGrowth = await prisma.company.create({
    data: {
      name: 'The Growth',
      nameLowercase: 'thegrowth',
      tenantId: tenantGrowth.id,
      principal_color: '#566E20',
    },
  });

  const usersGrowth = [
    {
      email: 'juan@thegrowth.pro',
      role: UserRoleEnum.AUCTION_MANAGER,
      name: 'Juan Manager',
      phone: '+56911111111',
      rut: '21.484.289-0',
      public_name: 'Usuario 1',
    },
    {
      email: 'juan1@thegrowth.pro',
      role: UserRoleEnum.USER,
      name: 'Juan User 1',
      public_name: 'Usuario 2',
      phone: '+56922222222',
      rut: '20.896.987-0',
    },
    {
      email: 'juan2@thegrowth.pro',
      role: UserRoleEnum.USER,
      name: 'Juan User 2',
      public_name: 'Usuario 3',
      phone: '+56933333333',
      rut: '23.569.878-1',
    },
  ];

  for (const u of usersGrowth) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        phone: u.phone,
        rut: u.rut,
        public_name: u.public_name,
      },
      create: {
        email: u.email,
        password: passwordGrowth,
        role: u.role,
        public_name: u.public_name,
        phone: u.phone,
        rut: u.rut,
        tenantId: tenantGrowth.id,
        companyId: companyGrowth.id,
      },
    });
  }

  for (let i = 1; i <= 8; i++) {
    await prisma.item.create({
      data: {
        plate: `ABKD3${i}`,
        brand: 'Toyota',
        model: `Corolla ${i}`,
        year: 2020 + (i % 5),
        state: ItemStateEnum.DISPONIBLE,
        tenantId: tenantGrowth.id,
        kilometraje: 50000,
        basePrice: 1000000 * i,
        description: `Item ${i} belonging to The Growth`,
      },
    });
  }

  // --- Nico Dev ---
  const tenantNico = await prisma.tenant.create({ data: {} });
  console.log('Created Tenant Nico:', tenantNico.id);

  const passwordNico = await bcrypt.hash('Yoyopopo7.', 10);

  const companyNico = await prisma.company.create({
    data: {
      name: 'Nico Dev',
      nameLowercase: 'nico dev',
      tenantId: tenantNico.id,
      principal_color: '#566E20',
    },
  });

  const usersNico = [
    {
      email: 'nico@test.cl',
      role: UserRoleEnum.AUCTION_MANAGER,
      name: 'Nico Manager',
      public_name: 'Usuario 1',
      phone: '+56944444444',
      rut: '21.484.239-9',
    },
    {
      email: 'nico1@test.cl',
      role: UserRoleEnum.USER,
      name: 'Nico User 1',
      public_name: 'Usuario 2',
      phone: '+56955555555',
      rut: '21.030.999-3',
    },
    {
      email: 'nico2@test.cl',
      role: UserRoleEnum.USER,
      name: 'Nico User 2',
      public_name: 'Usuario 3',
      phone: '+56966666666',
      rut: '21.967.456-2',
    },
  ];

  for (const u of usersNico) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        phone: u.phone,
        rut: u.rut,
        public_name: u.public_name,
      },
      create: {
        email: u.email,
        password: passwordNico,
        role: u.role,
        public_name: u.public_name,
        phone: u.phone,
        rut: u.rut,
        tenantId: tenantNico.id,
        companyId: companyNico.id,
      },
    });
  }

  for (let i = 1; i <= 8; i++) {
    await prisma.item.create({
      data: {
        plate: `ABCD1${i}`,
        brand: 'Nissan',
        model: `Sentra ${i}`,
        year: 2018 + (i % 5),
        state: ItemStateEnum.DISPONIBLE,
        kilometraje: 50000,
        tenantId: tenantNico.id,
        basePrice: 2000000 * i,
        description: `Item ${i} belonging to Nico Dev`,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
