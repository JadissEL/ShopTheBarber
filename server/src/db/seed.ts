import '../loadEnv';
import { prisma } from './prisma';

async function seed() {
    console.log('Seeding database...');

    // Clear existing data (order must respect FKs: delete dependents before parents)
    await prisma.application_documents.deleteMany({});
    await prisma.interview_schedules.deleteMany({});
    await prisma.job_applications.deleteMany({});
    await prisma.saved_jobs.deleteMany({});
    await prisma.applicant_credentials.deleteMany({});
    await prisma.applicant_profiles.deleteMany({});
    await prisma.jobs.deleteMany({});
    await prisma.companies.deleteMany({});
    await prisma.disputes.deleteMany({});
    await prisma.reviews.deleteMany({});
    await prisma.promo_codes.deleteMany({});
    await prisma.booking_services.deleteMany({});
    await prisma.payouts.deleteMany({});
    await prisma.bookings.deleteMany({});
    await prisma.staff_service_configs.deleteMany({});
    await prisma.shop_members.deleteMany({});
    await prisma.waiting_list_entries.deleteMany({});
    await prisma.time_blocks.deleteMany({});
    await prisma.shifts.deleteMany({});
    await prisma.services.deleteMany({});
    await prisma.order_items.deleteMany({});
    await prisma.orders.deleteMany({});
    await prisma.cart_items.deleteMany({});
    await prisma.products.deleteMany({});
    await prisma.barbers.deleteMany({});
    await prisma.shops.deleteMany({});
    await prisma.loyalty_transactions.deleteMany({});
    await prisma.loyalty_profiles.deleteMany({});
    await prisma.messages.deleteMany({});
    await prisma.notifications.deleteMany({});
    await prisma.favorites.deleteMany({});
    await prisma.brand_collections.deleteMany({});
    await prisma.brand_accolades.deleteMany({});
    await prisma.brands.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.pricing_rules.deleteMany({});

    console.log('Cleared existing data.');

    // Create Admin
    console.log('Creating Admin...');
    await prisma.users.create({
        data: {
            id: 'admin',
            email: 'admin@shopthebarber.com',
            full_name: 'Platform Admin',
            role: 'admin'
        }
    });

    // Create Barbers
    console.log('Creating Barbers...');
    const user1 = await prisma.users.create({
        data: {
            id: 'u1',
            email: 'james@example.com',
            full_name: 'James St. Patrick',            role: 'barber',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop'
        }
    });

    const user2 = await prisma.users.create({
        data: {
            id: 'u2',
            email: 'tasha@example.com',
            full_name: 'Tasha Green',            role: 'barber',
            avatar_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=100&auto=format&fit=crop'
        }
    });

    // Create Clients
    console.log('Creating Clients...');
    const client1 = await prisma.users.create({
        data: {
            id: 'c1',
            email: 'ghost@example.com',
            full_name: 'Ghost St. Patrick',            role: 'client'
        }
    });

    // Distinct barbershop/salon photos (Unsplash – interiors, chairs, mirrors)
    const shopPhotos = [
        'https://images.unsplash.com/photo-1512690459411-b9245aed8ad6?w=800&auto=format&fit=crop',   // barbershop interior
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop',   // salon interior
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop',   // barber chair
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop',     // barbershop
        'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop',   // modern salon
        'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&auto=format&fit=crop',   // barber station
        'https://images.unsplash.com/photo-1493256338650-d82f7acb2b38?w=800&auto=format&fit=crop',   // interior
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop',   // barbershop tools
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop',   // barbershop
        'https://images.unsplash.com/photo-1599356023803-1c0e1a2196e3?w=800&auto=format&fit=crop',   // grooming
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop',   // salon
    ];

    // Create Shops
    console.log('Creating Shops...');
    const shop1 = await prisma.shops.create({
        data: {
            id: 's1',
            name: 'Downtown Cuts',
            location: 'Downtown',
            image_url: shopPhotos[0]!
        }
    });

    // Create Barbers Profiles
    console.log('Creating Barbers Profiles...');
    await prisma.barbers.create({
        data: {
            id: 'b1',
            user_id: user1.id,
            shop_id: shop1.id,
            name: 'James St. Patrick',
            title: 'Master Barber',
            location: 'Downtown',
            rating: 5.0,
            review_count: 88,
            image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop'
        }
    });

    await prisma.barbers.create({
        data: {
            id: 'b2',
            user_id: user2.id,
            shop_id: shop1.id,
            name: 'Tasha Green',
            title: 'Senior Stylist',
            location: 'Downtown',
            rating: 4.9,
            review_count: 124,
            image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&auto=format&fit=crop'
        }
    });

    // --- Greece: shops, barbers, services (real-world style) ---
    console.log('Creating Greece shops...');
    const shop1Loc = 'Athens, Syntagma';
    const shop1Desc = 'Premium men\'s grooming in the heart of Athens.';
    await prisma.shops.update({ where: { id: 's1' }, data: { location: shop1Loc, description: shop1Desc } });

    const greeceShops: Array<{ id: string; name: string; location: string; description?: string; image_url: string }> = [
        { id: 's2', name: 'Classic Cuts Athens', location: 'Athens, Kolonaki', description: 'Upscale barbershop with traditional and modern cuts.', image_url: shopPhotos[1]! },
        { id: 's3', name: 'The Gentleman\'s Den', location: 'Athens, Exarcheia', description: 'Relaxed vibe, expert beard work and hot towel shaves.', image_url: shopPhotos[2]! },
        { id: 's4', name: 'Moustakas Barbershop', location: 'Thessaloniki, Aristotelous', description: 'Family-run barbershop since 1985. Classic and contemporary.', image_url: shopPhotos[3]! },
        { id: 's5', name: 'Urban Edge Salon', location: 'Thessaloniki, Ladadika', description: 'Modern cuts and styling for the urban gentleman.', image_url: shopPhotos[4]! },
        { id: 's6', name: 'Patras Grooming Co', location: 'Patras, Centre', description: 'Full grooming: haircut, beard, shave, facial.', image_url: shopPhotos[5]! },
        { id: 's7', name: 'Heraklion Barbers', location: 'Heraklion, Crete', description: 'Top-rated barbers in Crete. Walk-ins welcome.', image_url: shopPhotos[6]! },
        { id: 's8', name: 'Larissa Style House', location: 'Larissa, Kentro', description: 'Precision cuts and friendly service.', image_url: shopPhotos[7]! },
        { id: 's9', name: 'Volos Beard & Blade', location: 'Volos, Pagasitikos', description: 'Specialists in beard shaping and straight-razor shaves.', image_url: shopPhotos[8]! },
        { id: 's10', name: 'Ioannina Classic Barbers', location: 'Ioannina, Lake', description: 'Traditional barbering with a view.', image_url: shopPhotos[9]! },
    ];

    for (const s of greeceShops) {
        await prisma.shops.create({
            data: {
                id: s.id,
                name: s.name,
                location: s.location,
                description: s.description ?? null,
                image_url: s.image_url
            }
        });
    }

    // Greece barber users
    console.log('Creating Greece barber users...');
    const barberUserIds: string[] = [];
    for (let i = 1; i <= 24; i++) {
        const uid = `gu${i}`;
        barberUserIds.push(uid);
        await prisma.users.create({
            data: {
                id: uid,
                email: `barber${i}@greece.example.com`,
                full_name: `Barber User ${i}`,                role: i <= 10 ? 'shop_owner' : 'barber',
                avatar_url: i % 2 === 0
                    ? 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=100&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop'
            }
        });
    }

    // Distinct barber profile photos (Unsplash – barbers, grooming, professional portraits)
    const barberPhotos = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',   // man smiling
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&auto=format&fit=crop',   // stylist
        'https://images.unsplash.com/photo-1599356023803-1c0e1a2196e3?w=400&auto=format&fit=crop',   // man portrait
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop',     // professional
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',   // man smiling
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop',   // bearded man
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop',   // portrait
        'https://images.unsplash.com/photo-1519085360753-af0789f5ea4a?w=400&auto=format&fit=crop',   // barber scissors
        'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&auto=format&fit=crop',     // man grooming
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop',   // portrait
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&auto=format&fit=crop',   // professional
        'https://images.unsplash.com/photo-1507591064344-4c6cef03d071?w=400&auto=format&fit=crop',   // man
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop',   // woman portrait
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop',   // woman professional
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop',     // woman
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop',   // woman smiling
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop',   // professional woman
        'https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=400&auto=format&fit=crop',   // woman
        'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop',   // portrait
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop',   // professional
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&auto=format&fit=crop',   // professional
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop',   // woman
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop',   // woman
        'https://images.unsplash.com/photo-1547425260-abc356cfd25d?w=400&auto=format&fit=crop',     // man
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop',   // woman
    ];

    const greeceBarbers: Array<{ id: string; user_id: string; shop_id: string; name: string; title: string; location: string; rating: number; review_count: number; bio?: string; image_url: string }> = [
        { id: 'gb1', user_id: 'gu1', shop_id: 's1', name: 'Nikos Papadopoulos', title: 'Master Barber', location: 'Athens, Syntagma', rating: 4.9, review_count: 156, bio: '15+ years experience. Specializing in classic cuts and fades.', image_url: barberPhotos[0]! },
        { id: 'gb2', user_id: 'gu2', shop_id: 's2', name: 'Dimitris Karras', title: 'Senior Stylist', location: 'Athens, Kolonaki', rating: 4.8, review_count: 92, image_url: barberPhotos[1]! },
        { id: 'gb3', user_id: 'gu3', shop_id: 's2', name: 'Yannis Vasilis', title: 'Barber', location: 'Athens, Kolonaki', rating: 4.7, review_count: 64, image_url: barberPhotos[2]! },
        { id: 'gb4', user_id: 'gu4', shop_id: 's3', name: 'Michalis Kostas', title: 'Beard Specialist', location: 'Athens, Exarcheia', rating: 5.0, review_count: 203, image_url: barberPhotos[3]! },
        { id: 'gb5', user_id: 'gu5', shop_id: 's3', name: 'Stavros Georgiou', title: 'Master Barber', location: 'Athens, Exarcheia', rating: 4.8, review_count: 88, image_url: barberPhotos[4]! },
        { id: 'gb6', user_id: 'gu6', shop_id: 's4', name: 'Christos Moustakas', title: 'Owner & Master Barber', location: 'Thessaloniki, Aristotelous', rating: 4.9, review_count: 312, image_url: barberPhotos[5]! },
        { id: 'gb7', user_id: 'gu7', shop_id: 's4', name: 'Alexandros Nikou', title: 'Barber', location: 'Thessaloniki, Aristotelous', rating: 4.6, review_count: 45, image_url: barberPhotos[6]! },
        { id: 'gb8', user_id: 'gu8', shop_id: 's5', name: 'Petros Dimitriou', title: 'Senior Stylist', location: 'Thessaloniki, Ladadika', rating: 4.7, review_count: 78, image_url: barberPhotos[7]! },
        { id: 'gb9', user_id: 'gu9', shop_id: 's5', name: 'Andreas Ioannidis', title: 'Barber', location: 'Thessaloniki, Ladadika', rating: 4.5, review_count: 52, image_url: barberPhotos[8]! },
        { id: 'gb10', user_id: 'gu10', shop_id: 's6', name: 'Giorgos Patras', title: 'Master Barber', location: 'Patras, Centre', rating: 4.8, review_count: 120, image_url: barberPhotos[9]! },
        { id: 'gb11', user_id: 'gu11', shop_id: 's6', name: 'Kostas Patras', title: 'Barber', location: 'Patras, Centre', rating: 4.4, review_count: 38, image_url: barberPhotos[10]! },
        { id: 'gb12', user_id: 'gu12', shop_id: 's7', name: 'Manolis Heraklion', title: 'Senior Barber', location: 'Heraklion, Crete', rating: 4.9, review_count: 189, image_url: barberPhotos[11]! },
        { id: 'gb13', user_id: 'gu13', shop_id: 's7', name: 'Nikos Crete', title: 'Barber', location: 'Heraklion, Crete', rating: 4.6, review_count: 67, image_url: barberPhotos[12]! },
        { id: 'gb14', user_id: 'gu14', shop_id: 's8', name: 'Vangelis Larissa', title: 'Master Barber', location: 'Larissa, Kentro', rating: 4.7, review_count: 95, image_url: barberPhotos[13]! },
        { id: 'gb15', user_id: 'gu15', shop_id: 's8', name: 'Thomas Larissa', title: 'Stylist', location: 'Larissa, Kentro', rating: 4.5, review_count: 41, image_url: barberPhotos[14]! },
        { id: 'gb16', user_id: 'gu16', shop_id: 's9', name: 'Panagiotis Volos', title: 'Beard & Shave Expert', location: 'Volos, Pagasitikos', rating: 5.0, review_count: 134, image_url: barberPhotos[15]! },
        { id: 'gb17', user_id: 'gu17', shop_id: 's9', name: 'Dimitris Volos', title: 'Barber', location: 'Volos, Pagasitikos', rating: 4.7, review_count: 58, image_url: barberPhotos[16]! },
        { id: 'gb18', user_id: 'gu18', shop_id: 's10', name: 'Ioannis Ioannina', title: 'Classic Barber', location: 'Ioannina, Lake', rating: 4.8, review_count: 76, image_url: barberPhotos[17]! },
        { id: 'gb19', user_id: 'gu19', shop_id: 's10', name: 'Vasilis Ioannina', title: 'Barber', location: 'Ioannina, Lake', rating: 4.6, review_count: 33, image_url: barberPhotos[18]! },
        { id: 'gb20', user_id: 'gu20', shop_id: 's1', name: 'Maria Athina', title: 'Senior Stylist', location: 'Athens, Syntagma', rating: 4.9, review_count: 98, image_url: barberPhotos[19]! },
        { id: 'gb21', user_id: 'gu21', shop_id: 's4', name: 'Elena Thessaloniki', title: 'Stylist', location: 'Thessaloniki, Aristotelous', rating: 4.7, review_count: 55, image_url: barberPhotos[20]! },
        { id: 'gb22', user_id: 'gu22', shop_id: 's6', name: 'Sofia Patras', title: 'Barber', location: 'Patras, Centre', rating: 4.5, review_count: 29, image_url: barberPhotos[21]! },
        { id: 'gb23', user_id: 'gu23', shop_id: 's7', name: 'Eleni Crete', title: 'Barber', location: 'Heraklion, Crete', rating: 4.8, review_count: 72, image_url: barberPhotos[22]! },
        { id: 'gb24', user_id: 'gu24', shop_id: 's9', name: 'Katerina Volos', title: 'Stylist', location: 'Volos, Pagasitikos', rating: 4.6, review_count: 44, image_url: barberPhotos[23]! },
    ];

    console.log('Creating Greece barber profiles...');
    for (const b of greeceBarbers) {
        await prisma.barbers.create({
            data: {
                id: b.id,
                user_id: b.user_id,
                shop_id: b.shop_id,
                name: b.name,
                title: b.title,
                location: b.location,
                rating: b.rating,
                review_count: b.review_count,
                bio: b.bio ?? null,
                image_url: b.image_url,
                status: 'active'
            }
        });
    }

    // Shop members
    console.log('Creating Shop members...');
    for (const b of greeceBarbers) {
        await prisma.shop_members.create({
            data: {
                id: `sm-${b.id}`,
                shop_id: b.shop_id,
                user_id: b.user_id,
                role: b.title.toLowerCase().includes('owner') ? 'owner' : 'barber',
                barber_id: b.id
            }
        });
    }
    await prisma.shop_members.create({ data: { id: 'sm-b1', shop_id: 's1', user_id: user1.id, role: 'barber', barber_id: 'b1' } });
    await prisma.shop_members.create({ data: { id: 'sm-b2', shop_id: 's1', user_id: user2.id, role: 'barber', barber_id: 'b2' } });

    // Shifts
    console.log('Creating Shifts...');
    const barbersWithShops = await prisma.barbers.findMany({ select: { id: true, shop_id: true } });
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const barber of barbersWithShops) {
        const shopId = barber.shop_id ?? 's1';
        for (const day of weekdays) {
            await prisma.shifts.create({
                data: {
                    barber_id: barber.id,
                    shop_id: shopId,
                    day,
                    start_time: '09:00',
                    end_time: '17:00'
                }
            });
        }
    }

    // Services per shop
    console.log('Creating Services per shop...');
    type ServiceRow = { id: string; shop_id: string; barber_id: string | null; name: string; category: string; description: string | null; price: number; duration_minutes: number };
    const baseServices: Array<Omit<ServiceRow, 'shop_id' | 'price'>> = [
        { id: 'svc-hair', barber_id: null, name: 'Haircut', category: 'Hair', description: 'Classic or modern cut', duration_minutes: 30 },
        { id: 'svc-beard', barber_id: null, name: 'Beard Trim', category: 'Beard', description: 'Shape and trim', duration_minutes: 20 },
        { id: 'svc-shave', barber_id: null, name: 'Shave', category: 'Shave', description: 'Hot towel straight razor', duration_minutes: 25 },
        { id: 'svc-style', barber_id: null, name: 'Styling', category: 'Styling', description: 'Styling and product', duration_minutes: 15 },
        { id: 'svc-facial', barber_id: null, name: 'Facial', category: 'Facial', description: 'Cleansing and moisturizing', duration_minutes: 45 },
    ];
    const shopPriceMultipliers: Record<string, number> = {
        s1: 1.2, s2: 1.4, s3: 1.0, s4: 1.1, s5: 1.15, s6: 0.95, s7: 1.05, s8: 0.9, s9: 1.0, s10: 0.92
    };
    const basePrices: Record<string, number> = {
        'Haircut': 18, 'Beard Trim': 10, 'Shave': 16, 'Styling': 12, 'Facial': 28
    };
    let serviceId = 1000;
    for (const shopId of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']) {
        const mult = shopPriceMultipliers[shopId] ?? 1;
        for (const svc of baseServices) {
            const price = Math.round(basePrices[svc.name] * mult * 100) / 100;
            await prisma.services.create({
                data: {
                    id: `ser-${serviceId}`,
                    shop_id: shopId,
                    barber_id: null,
                    name: svc.name,
                    category: svc.category,
                    description: svc.description,
                    price,
                    duration_minutes: svc.duration_minutes
                }
            });
            serviceId++;
        }
    }
    // Original shop s1 already has ser1 — add more for s1
    await prisma.services.create({
        data: {
            id: 'ser1-beard',
            shop_id: 's1',
            name: 'Beard Trim',
            category: 'Beard',
            price: 12,
            duration_minutes: 20
        }
    });
    await prisma.services.create({
        data: {
            id: 'ser1-shave',
            shop_id: 's1',
            name: 'Shave',
            category: 'Shave',
            price: 18,
            duration_minutes: 25
        }
    });

    // Create Pricing Rules
    console.log('Creating Pricing Rules and Promo Codes...');
    await prisma.pricing_rules.create({
        data: {
            id: 'rule1',
            name: 'Default Platform Rules',
            commission_freelancer: 0.15,
            commission_shop: 0.05,
            is_active: true
        }
    });

    await prisma.promo_codes.create({
        data: {
            id: 'pc-s1-demo',
            code: 'DOWNTOWN10',
            discount_type: 'percentage',
            discount_value: 10,
            shop_id: 's1',
            is_active: true,
        }
    });
    await prisma.promo_codes.create({
        data: {
            id: 'pc-platform-demo',
            code: 'WELCOME5',
            discount_type: 'fixed',
            discount_value: 5,
            shop_id: null,
            is_active: true,
        }
    });

    // Create Services
    console.log('Creating Services...');
    await prisma.services.create({
        data: {
            id: 'ser1',
            shop_id: shop1.id,
            name: 'Signature Cut',
            price: 35.00,
            duration_minutes: 30,
            category: 'Hair'
        }
    });

    // Create Bookings
    console.log('Creating Bookings...');
    const now = new Date();
    const subHours = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
    const addHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

    const bookingData = [
        {
            id: 'bk1',
            barber_id: 'b1',
            shop_id: 's1',
            client_id: 'c1',
            start_time: subHours(48).toISOString(),
            end_time: subHours(47.5).toISOString(),
            status: 'completed',
            price_at_booking: 35,
            financial_breakdown: JSON.stringify({ platform_fee: 5.25 })
        },
        {
            id: 'bk2',
            barber_id: 'b1',
            shop_id: 's1',
            client_id: 'c1',
            start_time: subHours(24).toISOString(),
            end_time: subHours(23.5).toISOString(),
            status: 'completed',
            price_at_booking: 50,
            financial_breakdown: JSON.stringify({ platform_fee: 7.50 })
        },
        {
            id: 'bk3',
            barber_id: 'b2',
            shop_id: 's1',
            client_id: 'c1',
            start_time: addHours(2).toISOString(),
            end_time: addHours(2.5).toISOString(),
            status: 'confirmed',
            price_at_booking: 40,
            financial_breakdown: JSON.stringify({ platform_fee: 6.00 })
        }
    ];

    for (const b of bookingData) {
        await prisma.bookings.create({ data: b as any });
    }

    // Create Payouts
    console.log('Creating Payouts...');
    await prisma.payouts.create({
        data: {
            id: 'pay1',
            provider_id: 'b1',
            amount: 250.00,
            status: 'Completed',
            period_start: '2026-01-01',
            period_end: '2026-01-07'
        }
    });

    // Create Disputes
    console.log('Creating Disputes...');
    await prisma.disputes.create({
        data: {
            id: 'dis1',
            booking_id: 'bk1',
            reason: 'Service not as described',
            status: 'open'
        }
    });

    // Elite brand
    console.log('Creating Brands and Accolades...');
    const brandId = 'brand-aurelius';
    await prisma.brands.create({
        data: {
            id: brandId,
            name: 'Aurelius Grooming',
            slug: 'aurelius-grooming',
            logo_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&fit=crop',
            hero_image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&fit=crop',
            description: 'Crafting the standard of modern masculinity through rare ingredients and centuries-old artisanal techniques. Designed for the discerning gentleman who demands excellence in every ritual.',
            locations: 'New York • London • Paris',
            verified_elite: true,
            price_range: '$$$',
        }
    });
    await prisma.brand_accolades.createMany({
        data: [
            { id: 'acc1', brand_id: brandId, icon_key: 'trophy', label: 'MASTER BARBER 2024', sort_order: 1 },
            { id: 'acc2', brand_id: brandId, icon_key: 'star', label: '5.0 ELITE RATING', sort_order: 2 },
            { id: 'acc3', brand_id: brandId, icon_key: 'leaf', label: 'SUSTAINABLE PIONEER', sort_order: 3 },
            { id: 'acc4', brand_id: brandId, icon_key: 'art', label: 'ART HANDCRAFTED', sort_order: 4 },
        ]
    });
    await prisma.brand_collections.createMany({
        data: [
            { id: 'coll1', brand_id: brandId, name: 'The Obsidian Series', subtitle: 'Rare volcanic extracts.', image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&fit=crop', tag: 'LIMITED RELEASE', sort_order: 1 },
            { id: 'coll2', brand_id: brandId, name: 'Artisan Kit', subtitle: 'Daily performance.', image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&fit=crop', sort_order: 2 },
        ]
    });

    // Marketplace
    console.log('Creating Marketplace Products...');
    const productData = [
        { id: 'prod1', name: 'Signature Beard Oil', price: 42, category: 'Beard', seller_type: 'barber' as const, barber_id: 'b1', image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&fit=crop' },
        { id: 'prod2', name: 'Luxury Hair Pomade', price: 38, category: 'Hair', seller_type: 'platform' as const, image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&fit=crop' },
        { id: 'prod3', name: 'Premium Straight Razor', price: 189, category: 'Tools', seller_type: 'vendor' as const, vendor_name: 'Aurelius Grooming', image_url: 'https://images.unsplash.com/photo-1596981899093-11f15e5f60f0?w=400&fit=crop', brand_id: brandId },
        { id: 'prod4', name: 'Elite Face Serum', price: 68, category: 'Skincare', seller_type: 'barber' as const, barber_id: 'b1', image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&fit=crop' },
        { id: 'prod5', name: 'Wooden Comb Set', price: 55, category: 'Tools', seller_type: 'vendor' as const, vendor_name: 'Aurelius Grooming', image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop', brand_id: brandId },
        { id: 'prod6', name: 'Styling Clay', price: 32, category: 'Hair', seller_type: 'platform' as const, image_url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&fit=crop' },
        { id: 'prod7', name: 'Sandalwood Oil', price: 45, category: 'BEARD CARE', seller_type: 'vendor' as const, vendor_name: 'Aurelius Grooming', image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&fit=crop', brand_id: brandId },
        { id: 'prod8', name: 'The Heritage Razor', price: 120, category: 'TOOLS', seller_type: 'vendor' as const, vendor_name: 'Aurelius Grooming', image_url: 'https://images.unsplash.com/photo-1596981899093-11f15e5f60f0?w=400&fit=crop', brand_id: brandId },
        { id: 'prod9', name: 'Matte Fiber Clay', price: 32, category: 'STYLING', seller_type: 'vendor' as const, vendor_name: 'Aurelius Grooming', image_url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&fit=crop', brand_id: brandId },
        { id: 'prod10', name: 'Midnight Oud Cologne', price: 185, category: 'SCENT', seller_type: 'vendor' as const, vendor_name: 'Aurelius Grooming', image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&fit=crop', brand_id: brandId },
    ];
    for (const p of productData) {
        await prisma.products.create({ data: p });
    }

    // Employment
    console.log('Creating Companies and Jobs...');
    await prisma.companies.createMany({
        data: [
            { id: 'co1', name: 'Murdock London', description: 'Premium grooming and lifestyle brand.', location: 'London, UK', website: 'https://murdocklondon.com' },
            { id: 'co2', name: 'Aesop', description: 'Design-led skincare and fragrance.', location: 'Paris', website: 'https://www.aesop.com' },
            { id: 'co3', name: 'Royal Barber Co', description: 'High-end barbershop network.', location: 'London, UK' },
        ]
    });
    await prisma.jobs.createMany({
        data: [
            { id: 'job1', title: 'Regional Operations Director', category: 'management', employer_type: 'company', company_id: 'co1', employment_type: 'full_time', location_type: 'hybrid', location_text: 'London, UK', description: 'Architect of scale for our high-end barbershop network.', responsibilities: 'P&L Management; Talent Logistics; Quality Assurance.', salary_min: 85000, salary_max: 110000, salary_currency: 'GBP', status: 'published', featured: true, created_by: 'admin', image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop' },
            { id: 'job2', title: 'Logistics Manager', category: 'logistics', employer_type: 'company', company_id: 'co2', employment_type: 'full_time', location_type: 'on_site', location_text: 'Paris', description: 'Supply chain and operations for premium retail.', status: 'published', featured: true, created_by: 'admin', image_url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop' },
            { id: 'job3', title: 'Senior Barber', category: 'grooming', employer_type: 'shop', shop_id: 's1', employment_type: 'full_time', location_type: 'on_site', location_text: 'Athens, Syntagma', description: 'Master barber for our flagship location.', status: 'published', created_by: 'admin', image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop', featured: false },
            { id: 'job4', title: 'Brand Partnership Manager', category: 'branding', employer_type: 'company', company_id: 'co3', employment_type: 'full_time', location_type: 'hybrid', location_text: 'Los Angeles', salary_min: 120000, salary_max: 140000, status: 'published', created_by: 'admin', image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop', featured: false },
        ]
    });

    console.log('Seeding completed!');
}

seed()
    .catch(err => {
        console.error('Seeding failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
