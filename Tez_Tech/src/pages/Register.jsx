import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!/^[a-zA-Z][a-zA-Z\s.'-]{2,}$/.test(fullName)) {
      setError("Please enter a valid full name");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Please enter valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    const payload = {
      name: fullName,
      phone: formData.phone,
      email: formData.email,
      password: formData.password
    };

    const result = await register(payload);

    if (result.success) {
      navigate("/"); // ya /dashboard
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white border border-gray-100 shadow-lg rounded-xl">
        
        <div>
          <h1 className="text-3xl font-extrabold text-center text-gray-900">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-center text-gray-600">
            Join Sonani Electronics today
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm font-medium text-red-700 border-l-4 border-red-500 rounded-md bg-red-50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            
            {/* First Name & Last Name in one row on larger screens */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 placeholder-gray-400 transition-colors border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 placeholder-gray-400 transition-colors border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Enter 10 digit mobile number"
                className="block w-full px-3 py-2 placeholder-gray-400 transition-colors border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 placeholder-gray-400 transition-colors border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 placeholder-gray-400 transition-colors border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 placeholder-gray-400 transition-colors border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-gray-600">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default Register;
