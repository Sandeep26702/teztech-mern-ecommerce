import { body, validationResult } from "express-validator";

// Validation rules for adding/updating a product
export const validateProduct = [
  body("name")
    .notEmpty().withMessage("Product name is required")
    .trim()
    .isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),

  body("description")
    .optional()
    .trim(),

  body("sellingPrice")
    .notEmpty().withMessage("Selling Price is required")
    .isNumeric().withMessage("Selling Price must be a valid number")
    .custom((value) => value >= 0).withMessage("Price cannot be negative"),

  body("category1")
    .notEmpty().withMessage("Category 1 is required")
    .trim(),

  body("stock")
    .notEmpty().withMessage("Stock is required")
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

  body("weightKg")
    .notEmpty().withMessage("Weight is required")
    .isNumeric().withMessage("Weight must be a valid number")
    .custom((value) => Number(value) > 0).withMessage("Weight must be greater than 0"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive"),

  // Middleware to catch validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation Error", 
        errors: errors.array() 
      });
    }
    next();
  }
];
