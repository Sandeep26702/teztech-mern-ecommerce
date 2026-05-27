import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { getCache, setCache, clearCategoriesCache, cacheKeys } from "../utils/cache.js";

const DEFAULT_CATEGORY_IMAGE = "https://placehold.co/600x400?text=Category";

const normalizeName = (value = "") =>
  String(value || "").trim().replace(/\s+/g, " ");

const toSlug = (value = "") =>
  normalizeName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureCategoriesFromProducts = async (userId) => {
  const existing = await Category.find({}).select("name slug");
  const nameSet = new Set(existing.map((item) => item.name.toLowerCase()));
  const slugSet = new Set(existing.map((item) => item.slug));

  const productCategories = await Product.distinct("category");
  const missing = productCategories
    .map((item) => normalizeName(item))
    .filter(Boolean)
    .filter((item) => !nameSet.has(item.toLowerCase()));

  if (missing.length === 0) return;

  const docs = [];
  for (const name of missing) {
    const baseSlug = toSlug(name) || "category";
    let slug = baseSlug;
    let i = 1;
    while (slugSet.has(slug)) {
      slug = `${baseSlug}-${i}`;
      i += 1;
    }
    slugSet.add(slug);
    docs.push({
      name,
      slug,
      createdBy: userId,
      image: DEFAULT_CATEGORY_IMAGE,
    });
  }

  if (docs.length > 0) {
    await Category.insertMany(docs, { ordered: false });
  }
};

const withProductCount = async (categories) => {
  const counts = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);
  const countMap = new Map(counts.map((c) => [normalizeName(c._id).toLowerCase(), c.count]));

  return categories.map((category) => ({
    ...category.toObject(),
    productCount: countMap.get(category.name.toLowerCase()) || 0,
  }));
};

const getUnusedCategoryIds = async () => {
  const [categories, productCategories] = await Promise.all([
    Category.find({}).select("_id name"),
    Product.distinct("category"),
  ]);
  const activeNames = new Set(productCategories.map((name) => normalizeName(name).toLowerCase()));
  return categories
    .filter((item) => !activeNames.has(item.name.toLowerCase()))
    .map((item) => item._id);
};

export const getPublicCategories = async (req, res) => {
  try {
    const fallbackUser = req.user?._id;
    if (fallbackUser) {
      await ensureCategoriesFromProducts(fallbackUser);
    }

    const cached = getCache(cacheKeys.CATEGORIES_PUBLIC);
    if (cached) {
      return res.status(200).json({ success: true, categories: cached });
    }

    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug description image sortOrder");

    setCache(cacheKeys.CATEGORIES_PUBLIC, categories);

    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminCategories = async (req, res) => {
  try {
    await ensureCategoriesFromProducts(req.user._id);
    const categories = await Category.find({})
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug description image sortOrder isActive createdAt");
    const enriched = await withProductCount(categories);
    res.status(200).json({ success: true, categories: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const name = normalizeName(req.body.name);
    const description = normalizeName(req.body.description || "");
    const sortOrder = Number.isFinite(Number(req.body.sortOrder)) ? Number(req.body.sortOrder) : 0;
    const isActive = req.body.isActive === undefined ? true : String(req.body.isActive) !== "false";
    const image = req.file?.path || req.body.image || DEFAULT_CATEGORY_IMAGE;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existing = await Category.findOne({
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const baseSlug = toSlug(name) || "category";
    let slug = baseSlug;
    let i = 1;
    while (await Category.exists({ slug })) {
      slug = `${baseSlug}-${i}`;
      i += 1;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      sortOrder,
      isActive,
      createdBy: req.user._id,
    });

    clearCategoriesCache();

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const oldName = category.name;
    const newName = normalizeName(req.body.name || category.name);
    const description = req.body.description !== undefined ? normalizeName(req.body.description) : category.description;
    const sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : category.sortOrder;
    const isActive = req.body.isActive !== undefined ? String(req.body.isActive) !== "false" : category.isActive;
    const image = req.file?.path || req.body.image || category.image;

    const conflict = await Category.findOne({
      _id: { $ne: category._id },
      name: { $regex: `^${escapeRegex(newName)}$`, $options: "i" },
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: "Another category with this name already exists" });
    }

    category.name = newName;
    category.slug = toSlug(newName) || category.slug;
    category.description = description;
    category.sortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
    category.isActive = isActive;
    category.image = image;
    await category.save();

    if (oldName.toLowerCase() !== newName.toLowerCase()) {
      await Product.updateMany(
        { category: { $regex: `^${escapeRegex(oldName)}$`, $options: "i" } },
        { $set: { category: newName } }
      );
    }

    clearCategoriesCache();

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const productCount = await Product.countDocuments({
      category: { $regex: `^${escapeRegex(category.name)}$`, $options: "i" },
    });

    const targetCategoryId = req.body?.targetCategoryId || req.query?.targetCategoryId;
    if (productCount > 0 && !targetCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Category contains products. Provide targetCategoryId to move products first.",
        productCount,
      });
    }

    if (productCount > 0 && targetCategoryId) {
      const target = await Category.findById(targetCategoryId);
      if (!target) {
        return res.status(404).json({ success: false, message: "Target category not found" });
      }
      if (target._id.toString() === category._id.toString()) {
        return res.status(400).json({ success: false, message: "Target category must be different" });
      }

      await Product.updateMany(
        { category: { $regex: `^${escapeRegex(category.name)}$`, $options: "i" } },
        { $set: { category: target.name } }
      );
    }

    await category.deleteOne();
    clearCategoriesCache();
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reassignCategoryProducts = async (req, res) => {
  try {
    const { fromCategoryId, toCategoryId } = req.body;
    if (!fromCategoryId || !toCategoryId) {
      return res.status(400).json({ success: false, message: "fromCategoryId and toCategoryId are required" });
    }

    if (fromCategoryId === toCategoryId) {
      return res.status(400).json({ success: false, message: "Source and target category must be different" });
    }

    const [fromCategory, toCategory] = await Promise.all([
      Category.findById(fromCategoryId),
      Category.findById(toCategoryId),
    ]);

    if (!fromCategory || !toCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const result = await Product.updateMany(
      { category: { $regex: `^${escapeRegex(fromCategory.name)}$`, $options: "i" } },
      { $set: { category: toCategory.name } }
    );

    clearCategoriesCache();

    res.status(200).json({
      success: true,
      message: "Products reassigned successfully",
      movedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cleanupUnusedCategories = async (req, res) => {
  try {
    const unusedIds = await getUnusedCategoryIds();
    if (unusedIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unused categories found",
        deletedCount: 0,
      });
    }

    const result = await Category.deleteMany({ _id: { $in: unusedIds } });
    clearCategoriesCache();
    return res.status(200).json({
      success: true,
      message: "Unused categories removed successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ success: false, message: "Slug is required" });

    // Fetch the target category
    const target = await Category.findOne({ slug });
    if (!target) return res.status(404).json({ success: false, message: "Category not found" });

    const path = [target];
    let current = target;

    // Walk up the tree up to 3 levels to avoid infinite loops
    let depth = 0;
    while (current.parent && depth < 3) {
      const parent = await Category.findById(current.parent);
      if (!parent) break;
      path.unshift(parent); // Add to the beginning so it's Root -> Child -> Grandchild
      current = parent;
      depth++;
    }

    res.status(200).json({ success: true, tree: path });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
