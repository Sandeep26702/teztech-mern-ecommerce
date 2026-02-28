import Cart from "../models/Cart.js";

// ==========================================
// 1. GET CART: Fetch only the logged-in user's cart
// ==========================================
export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.productId",
      "name price images stock" 
    );
    
    if (!cart) {
      return res.status(200).json({ success: true, cart: { items: [] } });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== null);
    
    if (cart.items.length !== originalLength) {
      await cart.save();
    }
    
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 2. ADD TO CART: Add new item or increase quantity
// ==========================================
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId) return res.status(400).json({ success: false, message: "Product ID is required" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ productId, quantity: quantity || 1 }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += (quantity || 1);
      } else {
        cart.items.push({ productId, quantity: quantity || 1 });
      }
    }

    await cart.save();
    
    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price images stock"
    );
    
    res.status(200).json({ success: true, message: "Item added to cart", cart: updatedCart });

  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 3. REMOVE FROM CART: Delete a specific item
// ==========================================
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price images stock"
    );
    
    res.status(200).json({ success: true, message: "Item removed", cart: updatedCart });

  } catch (error) {
    console.error("Remove from Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 4. UPDATE QUANTITY: For Plus/Minus buttons
// ==========================================
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (quantity <= 0) {
      const cartToUpdate = await Cart.findOne({ user: userId });
      if(cartToUpdate) {
         cartToUpdate.items = cartToUpdate.items.filter(item => item.productId.toString() !== productId);
         await cartToUpdate.save();
         const updatedCart = await Cart.findById(cartToUpdate._id).populate("items.productId", "name price images stock");
         return res.status(200).json({ success: true, message: "Item removed due to 0 quantity", cart: updatedCart });
      }
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity; 
      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate(
        "items.productId",
        "name price images stock"
      );
      res.status(200).json({ success: true, message: "Quantity updated", cart: updatedCart });
    } else {
      res.status(404).json({ success: false, message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Update Cart Item Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 5. CLEAR CART: Used after successful checkout
// ==========================================
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({ success: true, message: "Cart cleared successfully", cart: { items: [] } });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// 6. 🚀 NEW: MERGE CART (Option B Logic)
// Combines guest local storage cart with DB cart on login
// ==========================================
export const mergeCart = async (req, res) => {
  try {
    const { localItems } = req.body; // Array coming from frontend localStorage
    const userId = req.user._id;

    // 1. Agar localStorage khali tha, toh bas user ka DB cart wapas bhej do
    if (!localItems || localItems.length === 0) {
      const cart = await Cart.findOne({ user: userId }).populate("items.productId", "name price images stock");
      return res.status(200).json({ success: true, message: "No items to merge", cart: cart || { items: [] } });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // 2. Agar user naya hai aur pehle se koi DB cart nahi hai, seedha local wala save kar do
      cart = new Cart({
        user: userId,
        items: localItems.map(item => ({
          productId: item._id || item.productId, // Handle both structures
          quantity: item.quantity || 1
        }))
      });
    } else {
      // 3. Agar DB mein bhi item hai aur Local mein bhi, toh MERGE karo
      for (let localItem of localItems) {
        const prodId = localItem._id || localItem.productId;
        const qty = localItem.quantity || 1;

        const itemIndex = cart.items.findIndex((dbItem) => dbItem.productId.toString() === prodId.toString());

        if (itemIndex > -1) {
          // Item DB me hai -> quantity badha do
          cart.items[itemIndex].quantity += qty;
        } else {
          // Naya item hai -> array me push kar do
          cart.items.push({ productId: prodId, quantity: qty });
        }
      }
    }

    await cart.save();

    // Frontend pe dikhane ke liye populate karke bhejo
    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price images stock"
    );

    res.status(200).json({ success: true, message: "Cart merged successfully", cart: updatedCart });
  } catch (error) {
    console.error("Merge Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};