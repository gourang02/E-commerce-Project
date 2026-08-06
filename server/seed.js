const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load Env
dotenv.config({ path: path.join(__dirname, ".env") });

const Category = require("./src/models/Category.model");
const Product = require("./src/models/Product.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/raunak_opticals";

const categoriesData = [
  { name: "Eyeglasses", slug: "eyeglasses", description: "Premium frames for prescription lenses", sortOrder: 1 },
  { name: "Sunglasses", slug: "sunglasses", description: "Fashionable protection against solar UV rays", sortOrder: 2 },
  { name: "Contact Lenses", slug: "contact-lenses", description: "Soft contact lenses with daily and monthly options", sortOrder: 3 },
  { name: "Computer Glasses", slug: "computer-glasses", description: "Blue light blocking glasses for digital screens", sortOrder: 4 },
  { name: "Reading Glasses", slug: "reading-glasses", description: "Ready-made readers for close range sight", sortOrder: 5 },
  { name: "Accessories", slug: "accessories", description: "Cases, cleaning kits, and strap cords", sortOrder: 6 },
];

const productsData = (categoryIds) => [
  // ── Eyeglasses ──────────────────────────────────────────────────
  {
    name: "AeroTitanium Rectangle Spec",
    slug: "aerotitanium-rectangle-spec",
    description: "Ultra lightweight titanium wire frame spectacles. Designed for heavy screen users who require all-day comfort. Matte color coatings resist corrosion.",
    shortDescription: "Ultra-lightweight titanium rectangular frames",
    category: categoryIds["eyeglasses"],
    brand: "Vincent Chase",
    price: 1899,
    mrp: 2999,
    tags: ["bestseller", "new-arrival"],
    frameDetails: {
      shape: "rectangle",
      material: "titanium",
      size: "m",
      lensWidth: 52,
      bridgeWidth: 18,
      templeLength: 140,
      weight: 12,
      gender: "unisex"
    },
    lensOptions: ["single-vision", "progressive", "blue-cut", "clear"],
    variants: [
      {
        color: "Matte Black",
        colorCode: "#111111",
        stock: 15,
        images: [{ url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop" }]
      },
      {
        color: "Silver Grey",
        colorCode: "#bdc3c7",
        stock: 8,
        images: [{ url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.7,
    reviewCount: 42,
    soldCount: 150
  },
  {
    name: "Classic Round Acetate Spec",
    slug: "classic-round-acetate-spec",
    description: "Chic vintage style round glasses made of high density cellulose acetate. Durable hinges and glossy finish.",
    shortDescription: "Vintage-styled round glossy acetate glasses",
    category: categoryIds["eyeglasses"],
    brand: "Lenskart Air",
    price: 1299,
    mrp: 1999,
    tags: ["featured"],
    frameDetails: {
      shape: "round",
      material: "acetate",
      size: "s",
      lensWidth: 49,
      bridgeWidth: 20,
      templeLength: 135,
      weight: 18,
      gender: "women"
    },
    lensOptions: ["single-vision", "bifocal", "photochromic", "clear"],
    variants: [
      {
        color: "Tortoise Shell",
        colorCode: "#8e6e4f",
        stock: 12,
        images: [{ url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop" }]
      },
      {
        color: "Clear Pink",
        colorCode: "#f5b7b1",
        stock: 6,
        images: [{ url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.5,
    reviewCount: 18,
    soldCount: 64
  },

  // ── Sunglasses ──────────────────────────────────────────────────
  {
    name: "Polarized Aviator Sunglasses",
    slug: "polarized-aviator-sunglasses",
    description: "Classic design military-grade aviator metal sunglasses. Polarized UV400 lenses eliminate glare while maintaining accurate color contrast under harsh sunlight.",
    shortDescription: "Military aviators with Polarized UV400 lenses",
    category: categoryIds["sunglasses"],
    brand: "Ray-Ban",
    price: 3499,
    mrp: 4999,
    tags: ["bestseller", "deal-of-day"],
    frameDetails: {
      shape: "aviator",
      material: "metal",
      size: "l",
      lensWidth: 58,
      bridgeWidth: 14,
      templeLength: 145,
      weight: 22,
      gender: "unisex"
    },
    lensOptions: ["polarized"],
    variants: [
      {
        color: "Golden Green",
        colorCode: "#d4af37",
        stock: 20,
        images: [{ url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop" }]
      },
      {
        color: "Black Mirror",
        colorCode: "#222222",
        stock: 10,
        images: [{ url: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.9,
    reviewCount: 120,
    soldCount: 400
  },
  {
    name: "Wayfarer UV Protected Sunglasses",
    slug: "wayfarer-uv-protected-sunglasses",
    description: "Lightweight polycarbonate wayfarers featuring scratch-resistant UV400 coated lenses. Perfect for beach and driving.",
    shortDescription: "Sporty wayfarers with full UV protection",
    category: categoryIds["sunglasses"],
    brand: "Oakley",
    price: 2199,
    mrp: 3499,
    tags: ["new-arrival"],
    frameDetails: {
      shape: "wayfarer",
      material: "other",
      size: "m",
      lensWidth: 54,
      bridgeWidth: 18,
      templeLength: 140,
      weight: 20,
      gender: "men"
    },
    lensOptions: ["photochromic", "polarized"],
    variants: [
      {
        color: "Matte Blue",
        colorCode: "#2e4053",
        stock: 14,
        images: [{ url: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.6,
    reviewCount: 30,
    soldCount: 90
  },

  // ── Contact Lenses ──────────────────────────────────────────────
  {
    name: "Acuvue Moist Monthly Lenses",
    slug: "acuvue-moist-monthly-lenses",
    description: "Breathable hydrogel monthly contact lenses. LACREON technology embeds a water-holding ingredient for long lasting moisture protection.",
    shortDescription: "Hydrating monthly contact lenses",
    category: categoryIds["contact-lenses"],
    brand: "Acuvue",
    price: 899,
    mrp: 1200,
    tags: ["bestseller"],
    frameDetails: {
      shape: "other",
      material: "other",
      size: "m",
      gender: "unisex"
    },
    lensOptions: ["clear"],
    variants: [
      {
        color: "Transparent Lenses",
        colorCode: "#d6eaf8",
        stock: 50,
        images: [{ url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.8,
    reviewCount: 88,
    soldCount: 320
  },

  // ── Computer Glasses ────────────────────────────────────────────
  {
    name: "ProScreen Blue-Cut Computer Glass",
    slug: "proscreen-blue-cut-computer-glass",
    description: "Premium computer glasses designed to block 98% of harmful blue light emitted from phone and computer displays. Reduces eye fatigue.",
    shortDescription: "Blue-cut lenses inside durable TR90 frames",
    category: categoryIds["computer-glasses"],
    brand: "Vincent Chase",
    price: 999,
    mrp: 1799,
    tags: ["bestseller", "featured"],
    frameDetails: {
      shape: "rectangle",
      material: "tr90",
      size: "m",
      lensWidth: 51,
      bridgeWidth: 17,
      templeLength: 138,
      weight: 14,
      gender: "unisex"
    },
    lensOptions: ["blue-cut"],
    variants: [
      {
        color: "Glossy Black",
        colorCode: "#000000",
        stock: 25,
        images: [{ url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop" }]
      },
      {
        color: "Clear Crystal",
        colorCode: "#f2f3f4",
        stock: 12,
        images: [{ url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.6,
    reviewCount: 54,
    soldCount: 210
  },

  // ── Accessories ─────────────────────────────────────────────────
  {
    name: "Premium Hard Shell Leather Case",
    slug: "premium-hard-shell-leather-case",
    description: "Luxury faux leather hard shell protective case. Soft micro-fiber lining prevents frame scratching.",
    shortDescription: "Luxurious protective hard shell cases",
    category: categoryIds["accessories"],
    brand: "Raunak Signature",
    price: 399,
    mrp: 599,
    tags: ["new-arrival"],
    frameDetails: {
      shape: "other",
      material: "other",
      size: "s",
      gender: "unisex"
    },
    lensOptions: [],
    variants: [
      {
        color: "Tan Brown",
        colorCode: "#a0522d",
        stock: 30,
        images: [{ url: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=600&auto=format&fit=crop" }]
      },
      {
        color: "Dark Onyx",
        colorCode: "#2c3e50",
        stock: 15,
        images: [{ url: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=600&auto=format&fit=crop" }]
      }
    ],
    ratingAvg: 4.4,
    reviewCount: 12,
    soldCount: 45
  }
];

async function seed() {
  try {
    console.log("Connecting to database:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    // Clear old data
    console.log("Clearing old collections...");
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Seed Categories
    console.log("Seeding Categories...");
    const createdCategories = await Category.insertMany(categoriesData);
    
    // Map slugs to ObjectIDs
    const categoryIds = {};
    createdCategories.forEach((cat) => {
      categoryIds[cat.slug] = cat._id;
    });

    // Seed Products
    console.log("Seeding Products...");
    const productsToInsert = productsData(categoryIds);
    await Product.insertMany(productsToInsert);

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
