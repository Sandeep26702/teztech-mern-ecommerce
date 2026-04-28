import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTrash, FaEdit, FaTruck, FaCheckCircle, FaTimesCircle, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ShippingManagement = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        baseRate: '',
        extraRatePerKg: '',
        isDefault: false,
        isActive: true
    });

    // 1. Fetch Providers
    const fetchProviders = async () => {
        try {
            const { data } = await api.get('/shipping');
            if (data.success) setProviders(data.providers);
        } catch (error) {
            console.error("Fetch error", error);
            toast.error("Failed to fetch providers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProviders(); }, []);

    // 2. Handle Add/Update
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = formData.id ? `/shipping/${formData.id}` : '/shipping';
            const method = formData.id ? 'put' : 'post';
            
            const { data } = await api[method](url, formData);
            if (data.success) {
                toast.success(formData.id ? "Updated successfully" : "Added successfully");
                setShowModal(false);
                setFormData({ id: null, name: '', baseRate: '', extraRatePerKg: '', isDefault: false, isActive: true });
                fetchProviders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save provider");
        }
    };

    // 3. Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this company?")) return;
        try {
            const { data } = await api.delete(`/shipping/${id}`);
            if (data.success) {
                toast.success("Deleted successfully");
                fetchProviders();
            }
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                            <FaTruck className="text-blue-600" /> Shipping Management
                        </h1>
                        <p className="text-sm text-gray-500">Manage your delivery partners and weight-based rates</p>
                    </div>
                    <button 
                        onClick={() => {
                            setFormData({ id: null, name: '', baseRate: '', extraRatePerKg: '', isDefault: false, isActive: true });
                            setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md"
                    >
                        <FaPlus /> Add New Company
                    </button>
                </div>

                {/* Shipping Providers Table */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Company Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Base Rate (1st KG)</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Extra Rate (Per KG)</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Default</th>
                                <th className="px-6 py-4 text-xs font-semibold text-center text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {providers.map((p) => (
                                <tr key={p._id} className="transition-colors hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                                    <td className="px-6 py-4 text-gray-700">₹{p.baseRate}</td>
                                    <td className="px-6 py-4 text-gray-700">₹{p.extraRatePerKg}</td>
                                    <td className="px-6 py-4">
                                        {p.isActive ? (
                                            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                                                <FaCheckCircle /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-sm font-medium text-red-400">
                                                <FaTimesCircle /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.isDefault && (
                                            <span className="flex items-center gap-1 text-sm font-bold text-yellow-600">
                                                <FaStar /> Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-3">
                                            <button 
                                                onClick={() => {
                                                    setFormData({
                                                        id: p._id,
                                                        name: p.name,
                                                        baseRate: p.baseRate,
                                                        extraRatePerKg: p.extraRatePerKg,
                                                        isDefault: p.isDefault,
                                                        isActive: p.isActive
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className="p-2 text-blue-500 transition-colors rounded-md hover:bg-blue-50"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p._id)}
                                                className="p-2 text-red-400 transition-colors rounded-md hover:bg-red-50"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {providers.length === 0 && !loading && (
                        <div className="p-10 text-center text-gray-400">No companies added yet. Click "Add New" to start.</div>
                    )}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden bg-white shadow-xl rounded-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                            <h3 className="font-bold text-gray-800">{formData.id ? 'Edit Company' : 'Add New Company'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimesCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Company Name</label>
                                <input 
                                    type="text" required value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. BlueDart"
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Base Rate (₹)</label>
                                    <input 
                                        type="number" required value={formData.baseRate} min="0" step="0.01"
                                        onChange={(e) => setFormData({...formData, baseRate: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Extra Per KG (₹)</label>
                                    <input 
                                        type="number" required value={formData.extraRatePerKg} min="0" step="0.01"
                                        onChange={(e) => setFormData({...formData, extraRatePerKg: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 py-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" checked={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                        className="w-5 h-5 rounded cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-black">Company is Active</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" checked={formData.isDefault}
                                        onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                                        className="w-5 h-5 rounded cursor-pointer text-yellow-600 focus:ring-yellow-500"
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-black">Set as Default Provider</span>
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                    {formData.id ? 'Save Changes' : 'Create Company'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingManagement;