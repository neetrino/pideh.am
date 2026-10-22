import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { hashPassword } from "@/lib/auth/password";
import * as schema from "@/db/schema";
import { getSeedEnv } from "@/db/seed/env";
import { seedIds } from "@/db/seed/ids";

async function seed(): Promise<void> {
  const env = getSeedEnv();
  const db = drizzle(neon(env.DATABASE_URL), { schema });

  const now = new Date();
  const adminPasswordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  const customerEmail = env.SEED_CUSTOMER_EMAIL ?? "customer@white-shop.local";
  const customerPassword = env.SEED_CUSTOMER_PASSWORD ?? env.SEED_ADMIN_PASSWORD;
  const customerPasswordHash = await hashPassword(customerPassword);

  await db
    .insert(schema.users)
    .values({
      id: seedIds.adminUser,
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      emailVerifiedAt: now,
      passwordHash: adminPasswordHash,
      passwordUpdatedAt: now,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
      termsAcceptedAt: now,
      termsVersion: "1.0",
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: env.SEED_ADMIN_EMAIL.toLowerCase(),
        passwordHash: adminPasswordHash,
        passwordUpdatedAt: now,
        role: "ADMIN",
        status: "ACTIVE",
        updatedAt: now,
      },
    });

  await db
    .insert(schema.users)
    .values({
      id: seedIds.customerUser,
      email: customerEmail.toLowerCase(),
      emailVerifiedAt: now,
      passwordHash: customerPasswordHash,
      passwordUpdatedAt: now,
      firstName: "Demo",
      lastName: "Customer",
      role: "CUSTOMER",
      status: "ACTIVE",
      termsAcceptedAt: now,
      termsVersion: "1.0",
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: customerEmail.toLowerCase(),
        passwordHash: customerPasswordHash,
        passwordUpdatedAt: now,
        role: "CUSTOMER",
        status: "ACTIVE",
        updatedAt: now,
      },
    });

  // Legacy single-city rule — keep inactive when present.
  await db
    .update(schema.deliveryRules)
    .set({ isActive: false, updatedAt: now })
    .where(eq(schema.deliveryRules.id, seedIds.deliveryArmenia));

  const yerevanCity = {
    hy: "Երևան",
    en: "Yerevan",
    ru: "Ереван",
  } as const;

  const yerevanZones = [
    {
      id: seedIds.deliveryKentron,
      area: { hy: "Կենտրոն", en: "Kentron", ru: "Кентрон" },
      priceAmount: 500,
      priority: 200,
    },
    {
      id: seedIds.deliveryAjapnyak,
      area: { hy: "Աջափնյակ", en: "Ajapnyak", ru: "Аджапняк" },
      priceAmount: 500,
      priority: 199,
    },
    {
      id: seedIds.deliveryArabkir,
      area: { hy: "Արաբկիր", en: "Arabkir", ru: "Арабкир" },
      priceAmount: 1000,
      priority: 198,
    },
    {
      id: seedIds.deliveryAvan,
      area: { hy: "Ավան", en: "Avan", ru: "Аван" },
      priceAmount: 1000,
      priority: 197,
    },
    {
      id: seedIds.deliveryDavtashen,
      area: { hy: "Դավթաշեն", en: "Davtashen", ru: "Давташен" },
      priceAmount: 1000,
      priority: 196,
    },
    {
      id: seedIds.deliveryErebuni,
      area: { hy: "Էրեբունի", en: "Erebuni", ru: "Эребуни" },
      priceAmount: 1000,
      priority: 195,
    },
    {
      id: seedIds.deliveryKanakerZeytun,
      area: { hy: "Քանաքեռ-Զեյթուն", en: "Kanaker-Zeytun", ru: "Канакер-Зейтун" },
      priceAmount: 1000,
      priority: 194,
    },
    {
      id: seedIds.deliveryMalatiaSebastia,
      area: { hy: "Մալաթիա-Սեբաստիա", en: "Malatia-Sebastia", ru: "Малатия-Себастия" },
      priceAmount: 1000,
      priority: 193,
    },
    {
      id: seedIds.deliveryNorNork,
      area: { hy: "Նոր Նորք", en: "Nor Nork", ru: "Нор Норк" },
      priceAmount: 1000,
      priority: 192,
    },
    {
      id: seedIds.deliveryNorkMarash,
      area: { hy: "Նորք-Մարաշ", en: "Nork-Marash", ru: "Норк-Мараш" },
      priceAmount: 1000,
      priority: 191,
    },
    {
      id: seedIds.deliveryShengavit,
      area: { hy: "Շենգավիթ", en: "Shengavit", ru: "Шенгавит" },
      priceAmount: 1000,
      priority: 190,
    },
  ] as const;

  for (const zone of yerevanZones) {
    const translations = {
      hy: { city: yerevanCity.hy, area: zone.area.hy },
      en: { city: yerevanCity.en, area: zone.area.en },
      ru: { city: yerevanCity.ru, area: zone.area.ru },
    };
    await db
      .insert(schema.deliveryRules)
      .values({
        id: zone.id,
        countryCode: "AM",
        city: yerevanCity.en,
        region: zone.area.en,
        translations,
        priceAmount: zone.priceAmount,
        freeThresholdAmount: null,
        isActive: true,
        priority: zone.priority,
      })
      .onConflictDoUpdate({
        target: schema.deliveryRules.id,
        set: {
          isActive: true,
          countryCode: "AM",
          city: yerevanCity.en,
          region: zone.area.en,
          translations,
          priceAmount: zone.priceAmount,
          freeThresholdAmount: null,
          priority: zone.priority,
          updatedAt: now,
        },
      });
  }

  await db
    .insert(schema.heroSlides)
    .values({
      id: seedIds.heroHome,
      translations: {
        hy: {
          title: "White Shop",
          subtitle: "New collection",
          buttonLabel: "Մենյու",
          buttonUrl: "/hy/products",
        },
        en: {
          title: "White Shop",
          subtitle: "New collection",
          buttonLabel: "Մենյու",
          buttonUrl: "/en/products",
        },
        ru: {
          title: "White Shop",
          subtitle: "New collection",
          buttonLabel: "Մենյու",
          buttonUrl: "/ru/products",
        },
      },
      sortOrder: 1,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: schema.heroSlides.id,
      set: {
        translations: {
          hy: {
            title: "White Shop",
            subtitle: "New collection",
            buttonLabel: "Մենյու",
            buttonUrl: "/hy/products",
          },
          en: {
            title: "White Shop",
            subtitle: "New collection",
            buttonLabel: "Մենյու",
            buttonUrl: "/en/products",
          },
          ru: {
            title: "White Shop",
            subtitle: "New collection",
            buttonLabel: "Մենյու",
            buttonUrl: "/ru/products",
          },
        },
        isActive: true,
        updatedAt: now,
      },
    });

  await db
    .insert(schema.promotions)
    .values({
      id: seedIds.promoWelcome,
      kind: "COUPON",
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscountAmount: 5000,
      minimumOrderAmount: 10000,
      totalUsageLimit: 1000,
      perUserUsageLimit: 1,
      isActive: true,
      priority: 10,
      allowStacking: false,
      startsAt: now,
    })
    .onConflictDoUpdate({
      target: schema.promotions.id,
      set: {
        isActive: true,
        discountValue: 10,
        updatedAt: now,
      },
    });

  await db
    .insert(schema.blogPosts)
    .values({
      id: seedIds.blogWelcome,
      authorUserId: seedIds.adminUser,
      status: "PUBLISHED",
      publishedAt: now,
      translations: {
        hy: {
          title: "Welcome to White Shop",
          slug: "bari-galust",
          excerpt: "Store launch",
          content: "<p>White Shop is ready.</p>",
        },
        en: {
          title: "Welcome to White Shop",
          slug: "welcome",
          excerpt: "Store launch note",
          content: "<p>White Shop is ready.</p>",
        },
        ru: {
          title: "Welcome to White Shop",
          slug: "dobro-pozhalovat",
          excerpt: "Store launch",
          content: "<p>White Shop is ready.</p>",
        },
      },
      tags: ["news", "launch"],
    })
    .onConflictDoUpdate({
      target: schema.blogPosts.id,
      set: {
        status: "PUBLISHED",
        updatedAt: now,
      },
    });

  await db
    .insert(schema.storeSettings)
    .values([
      {
        key: "store.identity",
        value: {
          version: 1,
          name: "White Shop",
          defaultLocale: "hy",
          defaultCurrency: "AMD",
        },
      },
      {
        key: "store.maintenance",
        value: { version: 1, enabled: false },
      },
    ])
    .onConflictDoUpdate({
      target: schema.storeSettings.key,
      set: {
        updatedAt: now,
      },
    });

  await db
    .insert(schema.appMeta)
    .values({
      key: "seed.version",
      value: "2",
    })
    .onConflictDoUpdate({
      target: schema.appMeta.key,
      set: {
        value: "2",
        updatedAt: now,
      },
    });

  console.info(
    JSON.stringify({
      level: "info",
      message: "seed.complete",
      adminEmail: env.SEED_ADMIN_EMAIL.toLowerCase(),
      customerEmail: customerEmail.toLowerCase(),
      coupon: "WELCOME10",
    }),
  );
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({ level: "error", message: "seed.failed", error: message }),
  );
  process.exitCode = 1;
});
