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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getAllProducts = async (req, res) => {
  const products = await Product.find({ isActive: true });
  res.json({
    success: true,
    products,
  });
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

  res.json({
    success: true,
    product,
  });
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    product,
  });
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });

  res.json({
    success: true,
    message: "Product deleted",
  });
};
