import Product from "../models/Product.js";

// @desc    Fetch all products from DB
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      products,
      totalProducts: products.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Product (Admin Only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, brand } = req.body;
    const image = req.file ? req.file.path : "";

    if (!name || !description || !price || !brand) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields (Name, Price, Brand, Description)" 
      });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock) || 0, // ✅ Model ke 'stock' field se match
      brand,
      image,
      user: req.user._id,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, brand } = req.body;
    
    // 1. Check if product exists
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Handle Image update
    const image = req.file ? req.file.path : product.image;

    // 3. Prepare Update Object with strict Number conversion
    // Humne model mein countInStock ko hata kar 'stock' kar diya hai
    const updatedData = {
      name: name || product.name,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      category: category || product.category,
      brand: brand || product.brand,
      stock: stock !== undefined ? Math.max(0, Number(stock)) : product.stock, // ✅ Fixed
      image: image
    };

    // 4. Update in Database
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData }, // ✅ $set ensures values are updated properly
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};