import { Product } from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    let images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });

        images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET PRODUCTS (SEARCH + PAGINATION) ================= */
export const getAllProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      page = 1,
      limit = 10,
      sort = "latest",
    } = req.query;

    let query = { isActive: true };

    if (keyword) query.$text = { $search: keyword };
    if (category) query.category = category;

    const skip = (page - 1) * limit;

    let sortOption = {};
    if (sort === "price_asc") sortOption.price = 1;
    else if (sort === "price_desc") sortOption.price = -1;
    else sortOption.createdAt = -1;

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const totalProducts = await Product.countDocuments(query);

    res.json({
      success: true,
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET SINGLE PRODUCT ================= */
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.json({ success: true, product });
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ success: true, product });
};

/* ================= DELETE PRODUCT (SOFT) ================= */
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });

  res.json({
    success: true,
    message: "Product deleted",
  });
};
