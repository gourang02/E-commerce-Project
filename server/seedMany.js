const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Category = require("./src/models/Category.model");
const Product = require("./src/models/Product.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/raunak_opticals";

const categoriesData = [
  { name: "Eyeglasses", slug: "eyeglasses", description: "Premium frames for prescription lenses", sortOrder: 1 },
  { name: "Sunglasses", slug: "sunglasses", description: "Fashionable protection against solar UV rays", sortOrder: 2 },
  { name: "Computer Glasses", slug: "computer-glasses", description: "Blue light blocking glasses for digital screens", sortOrder: 3 },
  { name: "Reading Glasses", slug: "reading-glasses", description: "Ready-made readers for close range sight", sortOrder: 4 },
  { name: "Contact Lenses", slug: "contact-lenses", description: "Soft contact lenses with daily and monthly options", sortOrder: 5 },
  { name: "Accessories", slug: "accessories", description: "Cases, cleaning kits, and strap cords", sortOrder: 6 },
];

const eyewearImages = [
  "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516715094483-75da7dee9758?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=600&auto=format&fit=crop"
];

const brands = ["Vincent Chase", "Lenskart Air", "John Jacobs", "Ray-Ban", "Oakley", "Carrera", "Fossil", "Vogue", "Aqualens", "Acuvue"];
const shapes = ["round", "square", "rectangle", "aviator", "cat-eye", "wayfarer", "oval", "geometric"];
const materials = ["metal", "acetate", "tr90", "titanium", "stainless-steel"];
const sizes = ["s", "m", "l"];
const genders = ["men", "women", "unisex", "kids"];
const colors = [
  { name: "Matte Black", code: "#111111" },
  { name: "Golden Gunmetal", code: "#d4af37" },
  { name: "Tortoise Shell", code: "#8e6e4f" },
  { name: "Crystal Clear", code: "#e5e8e8" },
  { name: "Deep Navy", code: "#1b263b" },
  { name: "Rose Gold", code: "#b76e79" },
  { name: "Silver Chrome", code: "#c0c0c0" },
  { name: "Emerald Green", code: "#2e7d32" }
];

const templates = [
  // Eyeglasses (12 items)
  { cat: "eyeglasses", prefix: "AeroTitanium", shape: "rectangle", material: "titanium", price: 1999, mrp: 3499, tags: ["bestseller", "featured"] },
  { cat: "eyeglasses", prefix: "Classic Acetate Round", shape: "round", material: "acetate", price: 1299, mrp: 2499, tags: ["bestseller"] },
  { cat: "eyeglasses", prefix: "Hustle Retro Wayfarer", shape: "wayfarer", material: "tr90", price: 999, mrp: 1999, tags: ["new-arrival"] },
  { cat: "eyeglasses", prefix: "Chic Cat-Eye Deluxe", shape: "cat-eye", material: "acetate", price: 1499, mrp: 2799, tags: ["featured", "deal-of-day"] },
  { cat: "eyeglasses", prefix: "Minimalist Rimless Oval", shape: "oval", material: "stainless-steel", price: 1799, mrp: 2999, tags: ["bestseller"] },
  { cat: "eyeglasses", prefix: "Urban Square Flex", shape: "square", material: "tr90", price: 1199, mrp: 2199, tags: ["new-arrival"] },
  { cat: "eyeglasses", prefix: "Geometric Hexagon Frame", shape: "geometric", material: "metal", price: 1599, mrp: 2699, tags: ["featured"] },
  { cat: "eyeglasses", prefix: "UltraLite Steel Rectangle", shape: "rectangle", material: "stainless-steel", price: 1399, mrp: 2299, tags: ["deal-of-day"] },
  { cat: "eyeglasses", prefix: "Vintage Half-Rim Club", shape: "square", material: "acetate", price: 1699, mrp: 2899, tags: ["bestseller"] },
  { cat: "eyeglasses", prefix: "FlexiFit Kid Specs", shape: "round", material: "tr90", price: 899, mrp: 1499, tags: ["new-arrival"] },
  { cat: "eyeglasses", prefix: "Titanium Air Pro", shape: "rectangle", material: "titanium", price: 2499, mrp: 3999, tags: ["bestseller", "featured"] },
  { cat: "eyeglasses", prefix: "Boho Round Metallic", shape: "round", material: "metal", price: 1099, mrp: 1899, tags: ["new-arrival"] },

  // Sunglasses (12 items)
  { cat: "sunglasses", prefix: "Polarized Aviator Pro", shape: "aviator", material: "metal", price: 3499, mrp: 5499, tags: ["bestseller", "deal-of-day"] },
  { cat: "sunglasses", prefix: "Wayfarer UV Shield", shape: "wayfarer", material: "acetate", price: 2199, mrp: 3999, tags: ["bestseller"] },
  { cat: "sunglasses", prefix: "Stealth Black Oversized", shape: "square", material: "tr90", price: 1899, mrp: 3299, tags: ["new-arrival"] },
  { cat: "sunglasses", prefix: "Hollywood Cat-Eye Glam", shape: "cat-eye", material: "acetate", price: 2799, mrp: 4499, tags: ["featured"] },
  { cat: "sunglasses", prefix: "Retro Round Sunnies", shape: "round", material: "metal", price: 1699, mrp: 2999, tags: ["bestseller"] },
  { cat: "sunglasses", prefix: "Ocean Blue Gradient Aviator", shape: "aviator", material: "stainless-steel", price: 2999, mrp: 4799, tags: ["deal-of-day"] },
  { cat: "sunglasses", prefix: "Sport Polarized Shield", shape: "square", material: "tr90", price: 2399, mrp: 3899, tags: ["new-arrival"] },
  { cat: "sunglasses", prefix: "Gold Rim Hexagon Sun", shape: "geometric", material: "titanium", price: 3199, mrp: 4999, tags: ["featured"] },
  { cat: "sunglasses", prefix: "Classic Clubmaster UV", shape: "square", material: "acetate", price: 2599, mrp: 4199, tags: ["bestseller"] },
  { cat: "sunglasses", prefix: "Mirrored Speed Racer", shape: "rectangle", material: "tr90", price: 1999, mrp: 3499, tags: ["new-arrival"] },
  { cat: "sunglasses", prefix: "Chrono Gold Aviator", shape: "aviator", material: "metal", price: 3999, mrp: 5999, tags: ["featured", "bestseller"] },
  { cat: "sunglasses", prefix: "Tortoise Gradient Round", shape: "round", material: "acetate", price: 2299, mrp: 3699, tags: ["deal-of-day"] },

  // Computer Glasses (8 items)
  { cat: "computer-glasses", prefix: "BlueCut Pro ScreenGuard", shape: "rectangle", material: "tr90", price: 999, mrp: 1799, tags: ["bestseller", "featured"] },
  { cat: "computer-glasses", prefix: "ZeroGlare Round Blue", shape: "round", material: "acetate", price: 1199, mrp: 1999, tags: ["bestseller"] },
  { cat: "computer-glasses", prefix: "Anti-Fatigue Square Tech", shape: "square", material: "tr90", price: 1299, mrp: 2199, tags: ["new-arrival"] },
  { cat: "computer-glasses", prefix: "DigitalShield Metal Oval", shape: "oval", material: "metal", price: 1399, mrp: 2399, tags: ["featured"] },
  { cat: "computer-glasses", prefix: "Gamers Blue-Blocker Pro", shape: "wayfarer", material: "tr90", price: 1499, mrp: 2499, tags: ["deal-of-day"] },
  { cat: "computer-glasses", prefix: "WorkFromHome Crystal Clear", shape: "cat-eye", material: "acetate", price: 1099, mrp: 1899, tags: ["bestseller"] },
  { cat: "computer-glasses", prefix: "ErgoComfort Titanium Blue", shape: "rectangle", material: "titanium", price: 2199, mrp: 3499, tags: ["featured"] },
  { cat: "computer-glasses", prefix: "SlimFit Reader Blue-Cut", shape: "round", material: "stainless-steel", price: 899, mrp: 1599, tags: ["new-arrival"] },

  // Reading Glasses (6 items)
  { cat: "reading-glasses", prefix: "ReadyReader +1.50 Magnifier", shape: "rectangle", material: "tr90", price: 599, mrp: 999, tags: ["bestseller"] },
  { cat: "reading-glasses", prefix: "Compact Foldable Reader +2.00", shape: "round", material: "metal", price: 799, mrp: 1299, tags: ["featured"] },
  { cat: "reading-glasses", prefix: "UltraClear Magnet Reader +2.50", shape: "square", material: "tr90", price: 899, mrp: 1499, tags: ["new-arrival"] },
  { cat: "reading-glasses", prefix: "Vintage Style Reader +1.00", shape: "round", material: "acetate", price: 699, mrp: 1199, tags: ["bestseller"] },
  { cat: "reading-glasses", prefix: "Pocket Slim Reader +1.75", shape: "rectangle", material: "stainless-steel", price: 649, mrp: 1099, tags: ["deal-of-day"] },
  { cat: "reading-glasses", prefix: "Luxe Acetate Reader +2.25", shape: "cat-eye", material: "acetate", price: 999, mrp: 1699, tags: ["new-arrival"] },

  // Contact Lenses (6 items)
  { cat: "contact-lenses", prefix: "Acuvue Moist Daily Hydrogel (30 Pack)", shape: "other", material: "other", price: 1899, mrp: 2400, tags: ["bestseller", "featured"] },
  { cat: "contact-lenses", prefix: "Aqualens 24 Hours Hydration Monthly", shape: "other", material: "other", price: 799, mrp: 1199, tags: ["bestseller"] },
  { cat: "contact-lenses", prefix: "ColorLook Hazel Brown Cosmetic Lens", shape: "other", material: "other", price: 699, mrp: 999, tags: ["new-arrival"] },
  { cat: "contact-lenses", prefix: "AirOptix Breathable Monthly Lens", shape: "other", material: "other", price: 1299, mrp: 1799, tags: ["featured"] },
  { cat: "contact-lenses", prefix: "Freshlook ColorBlends Sapphire Blue", shape: "other", material: "other", price: 899, mrp: 1399, tags: ["deal-of-day"] },
  { cat: "contact-lenses", prefix: "Biofinity Toric Astigmatism Monthly", shape: "other", material: "other", price: 2199, mrp: 2800, tags: ["new-arrival"] },

  // Accessories (6 items)
  { cat: "accessories", prefix: "Luxury Faux Leather Hard Shell Case", shape: "other", material: "other", price: 399, mrp: 699, tags: ["bestseller"] },
  { cat: "accessories", prefix: "Anti-Fog Lens Cleaning Spray + Cloth", shape: "other", material: "other", price: 249, mrp: 499, tags: ["bestseller", "featured"] },
  { cat: "accessories", prefix: "Braided Leather Glasses Cord Strap", shape: "other", material: "other", price: 199, mrp: 399, tags: ["new-arrival"] },
  { cat: "accessories", prefix: "Precision Repair Screwdriver Kit", shape: "other", material: "other", price: 299, mrp: 599, tags: ["deal-of-day"] },
  { cat: "accessories", prefix: "Microfiber Premium Cleaning Cloth 5-Pack", shape: "other", material: "other", price: 149, mrp: 299, tags: ["bestseller"] },
  { cat: "accessories", prefix: "Carbon Fiber Hard Eyeglass Travel Box", shape: "other", material: "other", price: 499, mrp: 899, tags: ["new-arrival"] }
];

async function seedMany() {
  try {
    console.log("Connecting to MongoDB Atlas:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    console.log("Clearing existing Categories & Products...");
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log("Seeding Categories...");
    const createdCategories = await Category.insertMany(categoriesData);
    const categoryIds = {};
    createdCategories.forEach((cat) => {
      categoryIds[cat.slug] = cat._id;
    });

    console.log("Generating products...");
    const productsToInsert = [];

    templates.forEach((tmpl, idx) => {
      const brand = brands[idx % brands.length];
      const img1 = eyewearImages[idx % eyewearImages.length];
      const img2 = eyewearImages[(idx + 3) % eyewearImages.length];

      const color1 = colors[idx % colors.length];
      const color2 = colors[(idx + 4) % colors.length];

      const gender = genders[idx % genders.length];
      const size = sizes[idx % sizes.length];

      const slug = `${tmpl.prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`;

      productsToInsert.push({
        name: `${tmpl.prefix} - ${brand}`,
        slug: slug,
        description: `Premium quality ${tmpl.prefix} by ${brand}. Features ergonomic lightweight frame design, optical grade scratch-resistant coating, and all-day comfort fit.`,
        shortDescription: `${tmpl.prefix} with high quality finish by ${brand}`,
        category: categoryIds[tmpl.cat],
        brand: brand,
        price: tmpl.price,
        mrp: tmpl.mrp,
        discount: Math.round(((tmpl.mrp - tmpl.price) / tmpl.mrp) * 100),
        tags: tmpl.tags,
        frameDetails: {
          shape: tmpl.shape,
          material: tmpl.material,
          size: size,
          lensWidth: 48 + (idx % 10),
          bridgeWidth: 16 + (idx % 4),
          templeLength: 135 + (idx % 10),
          weight: 12 + (idx % 15),
          gender: gender,
        },
        lensOptions: tmpl.cat === "sunglasses" ? ["polarized", "photochromic"] : tmpl.cat === "computer-glasses" ? ["blue-cut"] : tmpl.cat === "accessories" ? [] : ["single-vision", "progressive", "blue-cut", "clear"],
        variants: [
          {
            color: color1.name,
            colorCode: color1.code,
            stock: 15 + (idx % 20),
            images: [{ url: img1 }]
          },
          {
            color: color2.name,
            colorCode: color2.code,
            stock: 8 + (idx % 15),
            images: [{ url: img2 }]
          }
        ],
        ratingAvg: Number((4.2 + (idx % 8) * 0.1).toFixed(1)),
        reviewCount: 15 + idx * 7,
        soldCount: 50 + idx * 18,
        isActive: true
      });
    });

    console.log(`Inserting ${productsToInsert.length} products into MongoDB Atlas...`);
    await Product.insertMany(productsToInsert);

    console.log(`🎉 Successfully seeded ${createdCategories.length} Categories and ${productsToInsert.length} Products!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedMany();
