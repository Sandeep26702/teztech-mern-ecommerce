import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import ProductCard from "../components/common/ProductCard";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async () => {
    const { data } = await getProducts({
      keyword,
      page,
      limit: 8,
    });

    setProducts(data.products);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  return (
    <div className="container mt-4">
      <h3>Products</h3>

      {/* 🔍 SEARCH */}
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Search products..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className="btn btn-primary mt-2"
          onClick={() => {
            setPage(1);
            loadProducts();
          }}
        >
          Search
        </button>
      </div>

      {/* 📦 PRODUCT GRID */}
      <div className="row">
        {products.map((p) => (
          <div className="col-md-3 mb-4" key={p._id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* 📄 PAGINATION */}
      <div className="d-flex justify-content-center gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="btn btn-outline-secondary"
        >
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="btn btn-outline-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Products;
