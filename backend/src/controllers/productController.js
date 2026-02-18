import Product from "../models/Product.js";

// @desc    Fetch all products
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    // Filhal dummy data bhejte hain taaki frontend crash na ho
    // (Jab aap DB me products add karenge tab hum DB se fetch karenge)
    const products = [
      {
        _id: "1",
        name: "Wireless Headphones",
        price: 99.99,
        description: "High quality sound",
        image: "https://placehold.co/600x400",
      },
      {
        _id: "2",
        name: "Smart Watch",
        price: 199.99,
        description: "Track your fitness",
        image: "https://placehold.co/600x400",
      },
      {
        _id: "3",
        name: "Running Shoes",
        price: 49.99,
        description: "Comfortable running shoes",
        image: "https://placehold.co/600x400",
      }
    ];

    // Real DB code (Commented out for now until you add data):
    // const products = await Product.find({});
    
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  res.json({ message: "Single Product" });
};

export const createProduct = async (req, res) => {
  res.json({ message: "Admin Create Product" });
};

export const updateProduct = async (req, res) => {
  res.json({ message: "Admin Update Product" });
};

export const deleteProduct = async (req, res) => {
  res.json({ message: "Admin Delete Product" });
};