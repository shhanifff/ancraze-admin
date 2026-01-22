'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function addCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        teacherName: '',
        price: '',
        coverImage: null as File | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                coverImage: file
            }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('teacherName', formData.teacherName);
            formDataToSend.append('price', formData.price);
            if (formData.coverImage) {
                formDataToSend.append('coverImage', formData.coverImage);
            }

            const response = await fetch('/api/addcourse', {
                method: 'POST',
                body: formDataToSend,
            });

            // console.log()

            if (!response.ok) {
                throw new Error('Failed to create course');
            }

            const data = await response.json();
            console.log("course details",data)
            alert('Course created successfully!');
            router.push('/dashboard/course');
        } catch (error) {
            console.error('Error creating course:', error);
            alert('Error creating course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Course</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Field */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Enter course title"
                        />
                    </div>

                    {/* Description Field */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            placeholder="Enter course description"
                        />
                    </div>

                    {/* Teacher Name Field */}
                    <div>
                        <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700 mb-2">
                            Teacher Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="teacherName"
                            name="teacherName"
                            value={formData.teacherName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Enter teacher name"
                        />
                    </div>

                    {/* Price Field */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                            Price ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Enter course price"
                        />
                    </div>

                    {/* Cover Image Field */}
                    <div>
                        <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Image <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                id="coverImage"
                                name="coverImage"
                                onChange={handleImageChange}
                                required
                                accept="image/*"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        {imagePreview && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                <img
                                    src={imagePreview}
                                    alt="Cover preview"
                                    className="max-w-xs h-48 object-cover rounded-lg border border-gray-300"
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                        >
                            {loading ? 'Creating Course...' : 'Create Course'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/course')}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}