import {
  PrismaClient,
  UserRoleEnum,
  ItemStateEnum,
  AuctionStatusEnum,
  AuctionTypeEnum,
  LegalStatusEnum,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚗 Seeding Suba&Go — Subastas de Autos...\n');

  // ============================================================
  // 1. SUPER ADMIN  (Juan@subago.cl / Admin123.)
  // ============================================================
  const adminPassword = await bcrypt.hash('Admin123.', 10);

  const tenantAdmin = await prisma.tenant.create({ data: {} });
  console.log('✅ Tenant Admin creado:', tenantAdmin.id);

  const companySubaGo = await prisma.company.create({
    data: {
      name: 'Suba&Go',
      nameLowercase: 'subago',
      tenantId: tenantAdmin.id,
      principal_color: '#1E40AF',
      principal_color2: '#3B82F6',
      secondary_color: '#F59E0B',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'juan@subago.cl',
      password: adminPassword,
      role: UserRoleEnum.ADMIN,
      name: 'Juan Administrador',
      public_name: 'Admin',
      phone: '+56912345678',
      rut: '11.111.111-1',
      tenantId: tenantAdmin.id,
      companyId: companySubaGo.id,
    },
  });
  console.log('✅ Admin creado:', adminUser.email);

  // ============================================================
  // 2. TENANT: AutoSubasta Chile  (empresa de subastas de autos)
  // ============================================================
  const tenantAuto = await prisma.tenant.create({ data: {} });
  console.log('✅ Tenant AutoSubasta creado:', tenantAuto.id);

  const passwordDefault = await bcrypt.hash('Password1.', 10);

  const companyAuto = await prisma.company.create({
    data: {
      name: 'AutoSubasta Chile',
      nameLowercase: 'autosubastachile',
      tenantId: tenantAuto.id,
      principal_color: '#DC2626',
      principal_color2: '#991B1B',
      secondary_color: '#FBBF24',
    },
  });

  // --- Usuarios ---
  const managerAuto = await prisma.user.create({
    data: {
      email: 'gerente@autosubasta.cl',
      password: passwordDefault,
      role: UserRoleEnum.AUCTION_MANAGER,
      name: 'Carlos Muñoz',
      public_name: 'Carlos M.',
      phone: '+56987654321',
      rut: '15.234.567-8',
      tenantId: tenantAuto.id,
      companyId: companyAuto.id,
    },
  });

  const participantsAuto = [];
  const participantData = [
    { email: 'pedro@mail.cl', name: 'Pedro Soto', rut: '16.345.678-9', phone: '+56911223344', pn: 'Pedro S.' },
    { email: 'maria@mail.cl', name: 'María López', rut: '17.456.789-0', phone: '+56922334455', pn: 'María L.' },
    { email: 'andres@mail.cl', name: 'Andrés Rojas', rut: '18.567.890-1', phone: '+56933445566', pn: 'Andrés R.' },
    { email: 'carolina@mail.cl', name: 'Carolina Díaz', rut: '19.678.901-2', phone: '+56944556677', pn: 'Carolina D.' },
    { email: 'felipe@mail.cl', name: 'Felipe Araya', rut: '20.789.012-3', phone: '+56955667788', pn: 'Felipe A.' },
  ];

  for (const p of participantData) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        password: passwordDefault,
        role: UserRoleEnum.USER,
        name: p.name,
        public_name: p.pn,
        phone: p.phone,
        rut: p.rut,
        tenantId: tenantAuto.id,
        companyId: companyAuto.id,
      },
    });
    participantsAuto.push(user);
  }
  console.log(`✅ ${participantsAuto.length} participantes creados`);

  // ============================================================
  // 3. ITEMS (autos reales de Chile)
  // ============================================================
  const autoItems = [
    { plate: 'GGKR-21', brand: 'Toyota', model: 'Hilux SRV 4x4', year: 2022, km: 35000, price: 18500000, desc: 'Toyota Hilux SRV 2.8 Diesel, automática, doble cabina, techo panorámico, cámara de retroceso.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'HBWT-45', brand: 'Chevrolet', model: 'Onix LTZ 1.0T', year: 2023, km: 12000, price: 11200000, desc: 'Chevrolet Onix LTZ Turbo, automático, pantalla 8\", android auto, sensores de estacionamiento.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'FXPL-78', brand: 'Hyundai', model: 'Tucson 2.0 GL', year: 2021, km: 48000, price: 15800000, desc: 'Hyundai Tucson 2.0 automática, techo solar, asientos calefaccionados, lane assist.', legal: LegalStatusEnum.LEASING },
    { plate: 'DZKM-33', brand: 'Kia', model: 'Sportage EX 2.0', year: 2022, km: 28000, price: 16900000, desc: 'Kia Sportage EX 2.0, automática, cuero, pantalla 10.25\", cámara 360°.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'JVNR-12', brand: 'Suzuki', model: 'Swift GLX 1.2', year: 2023, km: 8500, price: 9500000, desc: 'Suzuki Swift GLX, mecánico, techo solar, llantas 16\", control de crucero.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'CLWP-56', brand: 'Nissan', model: 'Qashqai Exclusive', year: 2020, km: 62000, price: 14200000, desc: 'Nissan Qashqai Exclusive CVT, cuero, navegación GPS, ProPilot, techo panorámico.', legal: LegalStatusEnum.PRENDA },
    { plate: 'KXMT-89', brand: 'Mazda', model: 'CX-5 GT 2.5', year: 2021, km: 38000, price: 19800000, desc: 'Mazda CX-5 GT 2.5, AWD, automática, BOSE, cuero, head-up display.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'BNFH-67', brand: 'Ford', model: 'Ranger XLT 3.2 TDCi', year: 2019, km: 85000, price: 16500000, desc: 'Ford Ranger XLT 3.2 Diesel, automática, doble cabina, barra antivuelco, estribos.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'MVRA-44', brand: 'Mitsubishi', model: 'L200 Katana', year: 2023, km: 15000, price: 20500000, desc: 'Mitsubishi L200 Katana 2.4 Diesel, automática 6AT, diferencial trasero, selección de terreno.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'PRSG-91', brand: 'Peugeot', model: '3008 GT Line', year: 2022, km: 22000, price: 21000000, desc: 'Peugeot 3008 GT Line 1.6T, automática, i-Cockpit, grip control, techo panorámico.', legal: LegalStatusEnum.LEASING },
    { plate: 'WNKL-15', brand: 'Volkswagen', model: 'Amarok Comfortline V6', year: 2021, km: 55000, price: 25000000, desc: 'VW Amarok Comfortline V6 3.0 TDI, automática 8AT, tracción 4MOTION, 258 HP.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'TDXE-28', brand: 'Subaru', model: 'XV 2.0 AWD', year: 2022, km: 30000, price: 17500000, desc: 'Subaru XV 2.0 AWD, automática CVT, EyeSight, X-Mode, asientos calefaccionados.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'RGLQ-73', brand: 'Toyota', model: 'RAV4 Hybrid', year: 2023, km: 10000, price: 28000000, desc: 'Toyota RAV4 Hybrid 2.5, AWD-i, automática eCVT, Toyota Safety Sense, 222 HP combinados.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'HFYC-50', brand: 'Chevrolet', model: 'Tracker Premier', year: 2022, km: 25000, price: 13500000, desc: 'Chevrolet Tracker Premier 1.2T, automática, techo solar, pantalla 10.1\", OnStar.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'ZSXW-36', brand: 'MG', model: 'ZS EV Luxury', year: 2023, km: 5000, price: 22000000, desc: 'MG ZS EV Luxury 100% eléctrico, 320 km autonomía, carga rápida DC, cuero vegano.', legal: LegalStatusEnum.TRANSFERIBLE },
    { plate: 'BPCM-82', brand: 'Jeep', model: 'Compass Limited', year: 2021, km: 42000, price: 19000000, desc: 'Jeep Compass Limited 1.3T, automática 6AT, cuero, UConnect 10.1\", sensor de punto ciego.', legal: LegalStatusEnum.PRENDA },
  ];

  const createdItems = [];
  for (const a of autoItems) {
    const item = await prisma.item.create({
      data: {
        plate: a.plate,
        brand: a.brand,
        model: a.model,
        year: a.year,
        kilometraje: a.km,
        basePrice: a.price,
        description: a.desc,
        legal_status: a.legal,
        state: ItemStateEnum.DISPONIBLE,
        tenantId: tenantAuto.id,
      },
    });
    createdItems.push(item);
  }
  console.log(`✅ ${createdItems.length} autos creados`);

  // ============================================================
  // 4. SUBASTAS
  // ============================================================

  // --- Subasta Activa: Remate Premium Marzo 2026 ---
  const now = new Date();
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const auctionActive = await prisma.auction.create({
    data: {
      title: 'Remate Premium Marzo 2026',
      description: 'Gran remate de vehículos premium. SUVs, camionetas y sedanes de las mejores marcas con financiamiento disponible.',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // empezó hace 30 min
      endTime: in3Hours,
      status: AuctionStatusEnum.ACTIVA,
      type: AuctionTypeEnum.REAL,
      bidIncrement: 100000,
      tenantId: tenantAuto.id,
    },
  });

  // Asignar 6 items a subasta activa
  const activeAuctionItems = [];
  for (let i = 0; i < 6; i++) {
    const ai = await prisma.auctionItem.create({
      data: {
        auctionId: auctionActive.id,
        itemId: createdItems[i].id,
        startingBid: createdItems[i].basePrice,
        startTime: auctionActive.startTime,
        endTime: auctionActive.endTime,
      },
    });
    activeAuctionItems.push(ai);

    // Actualizar state del item
    await prisma.item.update({
      where: { id: createdItems[i].id },
      data: { state: ItemStateEnum.EN_SUBASTA },
    });
  }

  // Registrar participantes en la subasta activa
  for (const p of participantsAuto) {
    await prisma.auctionRegistration.create({
      data: { userId: p.id, auctionId: auctionActive.id },
    });
  }

  // Generar bids realistas en la subasta activa
  const bidTimes = [
    new Date(now.getTime() - 25 * 60 * 1000),
    new Date(now.getTime() - 20 * 60 * 1000),
    new Date(now.getTime() - 15 * 60 * 1000),
    new Date(now.getTime() - 10 * 60 * 1000),
    new Date(now.getTime() - 5 * 60 * 1000),
  ];

  // Bids en item 0 (Hilux)
  const hiluxBids = [
    { user: 0, price: 18600000, time: 0 },
    { user: 1, price: 18700000, time: 1 },
    { user: 2, price: 18800000, time: 2 },
    { user: 0, price: 18900000, time: 3 },
    { user: 3, price: 19000000, time: 4 },
  ];
  for (const b of hiluxBids) {
    await prisma.bid.create({
      data: {
        offered_price: b.price,
        bid_time: bidTimes[b.time],
        userId: participantsAuto[b.user].id,
        auctionId: auctionActive.id,
        auctionItemId: activeAuctionItems[0].id,
        tenantId: tenantAuto.id,
      },
    });
  }

  // Bids en item 1 (Onix)
  const onixBids = [
    { user: 1, price: 11300000, time: 0 },
    { user: 4, price: 11400000, time: 1 },
    { user: 1, price: 11500000, time: 3 },
  ];
  for (const b of onixBids) {
    await prisma.bid.create({
      data: {
        offered_price: b.price,
        bid_time: bidTimes[b.time],
        userId: participantsAuto[b.user].id,
        auctionId: auctionActive.id,
        auctionItemId: activeAuctionItems[1].id,
        tenantId: tenantAuto.id,
      },
    });
  }

  // Bids en item 3 (Sportage)
  const sportBids = [
    { user: 2, price: 17000000, time: 0 },
    { user: 3, price: 17100000, time: 2 },
    { user: 4, price: 17200000, time: 4 },
  ];
  for (const b of sportBids) {
    await prisma.bid.create({
      data: {
        offered_price: b.price,
        bid_time: bidTimes[b.time],
        userId: participantsAuto[b.user].id,
        auctionId: auctionActive.id,
        auctionItemId: activeAuctionItems[3].id,
        tenantId: tenantAuto.id,
      },
    });
  }

  console.log('✅ Subasta activa con bids creada');

  // --- Subasta Pendiente: Remate Camionetas Abril 2026 ---
  const april10 = new Date('2026-04-10T14:00:00-03:00');
  const april10End = new Date('2026-04-10T18:00:00-03:00');

  const auctionPending = await prisma.auction.create({
    data: {
      title: 'Remate Camionetas Abril 2026',
      description: 'Remate exclusivo de camionetas 4x4 y pick-ups. Vehículos de trabajo y aventura con excelente rendimiento.',
      startTime: april10,
      endTime: april10End,
      status: AuctionStatusEnum.PENDIENTE,
      type: AuctionTypeEnum.REAL,
      bidIncrement: 150000,
      tenantId: tenantAuto.id,
    },
  });

  // Asignar items 6-9 a subasta pendiente
  for (let i = 6; i < 10; i++) {
    await prisma.auctionItem.create({
      data: {
        auctionId: auctionPending.id,
        itemId: createdItems[i].id,
        startingBid: createdItems[i].basePrice,
      },
    });
  }
  console.log('✅ Subasta pendiente creada');

  // --- Subasta Completada: Remate Febrero 2026 ---
  const feb15Start = new Date('2026-02-15T10:00:00-03:00');
  const feb15End = new Date('2026-02-15T16:00:00-03:00');

  const auctionCompleted = await prisma.auction.create({
    data: {
      title: 'Remate Febrero 2026 - Autos de Ciudad',
      description: 'Remate finalizado con éxito. Sedanes y SUVs compactos para la ciudad.',
      startTime: feb15Start,
      endTime: feb15End,
      status: AuctionStatusEnum.COMPLETADA,
      type: AuctionTypeEnum.REAL,
      bidIncrement: 50000,
      tenantId: tenantAuto.id,
    },
  });

  // Asignar items 10-13 a subasta completada (vendidos)
  for (let i = 10; i < 14; i++) {
    const ai = await prisma.auctionItem.create({
      data: {
        auctionId: auctionCompleted.id,
        itemId: createdItems[i].id,
        startingBid: createdItems[i].basePrice,
        startTime: feb15Start,
        endTime: feb15End,
      },
    });

    // Marcar como vendido
    const soldPrice = createdItems[i].basePrice + (Math.floor(Math.random() * 8) + 2) * 100000;
    const buyerIdx = i % participantsAuto.length;

    await prisma.item.update({
      where: { id: createdItems[i].id },
      data: {
        state: ItemStateEnum.VENDIDO,
        soldPrice,
        soldAt: feb15End,
        soldToUserId: participantsAuto[buyerIdx].id,
      },
    });

    // Bid ganadora
    await prisma.bid.create({
      data: {
        offered_price: soldPrice,
        bid_time: new Date(feb15End.getTime() - 5 * 60 * 1000),
        userId: participantsAuto[buyerIdx].id,
        auctionId: auctionCompleted.id,
        auctionItemId: ai.id,
        tenantId: tenantAuto.id,
      },
    });
  }

  // Registrar participantes en subasta completada
  for (const p of participantsAuto) {
    await prisma.auctionRegistration.create({
      data: { userId: p.id, auctionId: auctionCompleted.id },
    });
  }
  console.log('✅ Subasta completada con ventas creada');

  // --- Subasta de Prueba ---
  const auctionTest = await prisma.auction.create({
    data: {
      title: 'Subasta de Prueba - Demo',
      description: 'Subasta de demostración para probar el sistema. Los datos son ficticios.',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      status: AuctionStatusEnum.PENDIENTE,
      type: AuctionTypeEnum.TEST,
      bidIncrement: 50000,
      tenantId: tenantAuto.id,
    },
  });

  // Items restantes (14-15) para la subasta de prueba
  for (let i = 14; i < 16; i++) {
    await prisma.auctionItem.create({
      data: {
        auctionId: auctionTest.id,
        itemId: createdItems[i].id,
        startingBid: createdItems[i].basePrice,
      },
    });
  }
  console.log('✅ Subasta de prueba creada');

  // ============================================================
  // 5. FEEDBACK
  // ============================================================
  await prisma.feedback.create({
    data: {
      category: 'Comentarios',
      title: 'Excelente plataforma',
      message: 'Me gustó mucho la experiencia de subastar. La interfaz es clara y los tiempos se respetan bien.',
      userId: participantsAuto[0].id,
      tenantId: tenantAuto.id,
    },
  });
  await prisma.feedback.create({
    data: {
      category: 'Feedback',
      title: 'Sugerencia: alertas por WhatsApp',
      message: 'Estaría genial recibir notificaciones por WhatsApp cuando una subasta está por terminar o cuando alguien supera mi oferta.',
      userId: participantsAuto[1].id,
      tenantId: tenantAuto.id,
    },
  });
  await prisma.feedback.create({
    data: {
      category: 'Críticas',
      title: 'Demora al cargar fotos',
      message: 'Las fotos de los autos tardan bastante en cargar, especialmente en conexión móvil. Sería bueno optimizar el tamaño.',
      userId: participantsAuto[2].id,
      tenantId: tenantAuto.id,
    },
  });
  console.log('✅ Feedback creado');

  // ============================================================
  // RESUMEN
  // ============================================================
  console.log('\n========================================');
  console.log('🎉 Seed completado exitosamente!');
  console.log('========================================');
  console.log('\n📋 CREDENCIALES ADMIN:');
  console.log('   Email:    juan@subago.cl');
  console.log('   Password: Admin123.');
  console.log('   Rol:      ADMIN');
  console.log('\n📋 CREDENCIALES MANAGER:');
  console.log('   Email:    gerente@autosubasta.cl');
  console.log('   Password: Password1.');
  console.log('   Rol:      AUCTION_MANAGER');
  console.log('\n📋 CREDENCIALES PARTICIPANTE (ejemplo):');
  console.log('   Email:    pedro@mail.cl');
  console.log('   Password: Password1.');
  console.log('   Rol:      USER');
  console.log('\n🚗 Datos creados:');
  console.log(`   - ${createdItems.length} autos`);
  console.log('   - 4 subastas (1 activa, 2 pendientes, 1 completada)');
  console.log(`   - ${participantsAuto.length} participantes`);
  console.log('   - Bids en subasta activa');
  console.log('   - 4 autos vendidos en subasta completada');
  console.log('   - 3 feedbacks');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
