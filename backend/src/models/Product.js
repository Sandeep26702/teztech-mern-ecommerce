import mongoose from "mongoose";

const detailItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// 🔥 VARIANT SCHEMA (IMPROVED)
const variantSchema = new mongoose.Schema(
  {
    combination: {
      type: Map,
      of: String,
      default: {},
    },

    price: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    meta: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // 🔥 crash safe
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔥 BASE SKU (MAIN IDENTIFIER)
    baseSku: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    slug: {
      type: String,
      index: true,
    },

    image: {
      type: String,
      default: "https://placehold.co/600x600?text=Product",
    },

    images: {
      type: [String],
      default: [],
    },

    brand: {
      type: String,
      default: "",
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    category: {
      type: String,
      default: "Uncategorized",
      trim: true,
    },

    categories: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },

    // 🔥 BASE PRICE (fallback)
    price: {
      type: Number,
      default: 0,
    },

    gstRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    weightKg: {
      type: Number,
      default: 0,
    },

    // 🔥 ONLY FOR NON-VARIANT PRODUCTS
    stock: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Active",
    },

    searchTags: {
      type: [String],
      default: [],
    },

    searchIndex: {
      type: String,
      default: "",
      index: true,
    },

    // 🔥 ATTRIBUTES (Color, Size etc.)
    attributes: [
      {
        name: String,
        type: {
          type: String,
          default: "select",
        },
        options: [
          {
            value: String,
            priceAdjustment: {
              type: Number,
              default: 0,
            },
            meta: {
              type: Map,
              of: String,
              default: {},
            },
          },
        ],
      },
    ],

    // 🔥 VARIANTS
    variants: {
      type: [variantSchema],
      default: [],
    },

    hasVariants: {
      type: Boolean,
      default: true,
    },

    // 🔥 FLEXIBLE FIELDS
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metaData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    relations: {
      relatedProducts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      ],
      crossSellProducts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      ],
    },

    media: {
      videos: { type: [String], default: [] },
      documents: { type: [String], default: [] },
    },

    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    details: {
      type: [detailItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// 🔥 INDEXES (PERFORMANCE)
// ==========================

productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", searchIndex: "text" });

// ==========================
// 🔥 AUTO SLUG + SEARCH INDEX (ORDER CRASH FIX APPLIED)
// ==========================
productSchema.pre("save", async function () {
  // Slug tabhi banega jab product naya ho ya naam update ho
  if (this.isModified("name") && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }

  const tags = Array.isArray(this.searchTags) ? this.searchTags : [];

  // .filter(Boolean) undefined errors ko rokega
  this.searchIndex = [
    this.name,
    this.baseSku,
    this.brand,
    this.category,
    ...tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
});

// Nodemon auto-restart me model overwrite error se bachne ke liye
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;