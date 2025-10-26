import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api/axiosConfig';
import SafeIcon from '@/common/SafeIcon';

const { FiArrowLeft, FiImage, FiPlusCircle, FiUploadCloud, FiCrop } = FiIcons;

const CreateCommunity = () => {
  const { theme } = useTheme();
  const { switchCommunity } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PNG, JPG, or WEBP images are allowed');
      return;
    }
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      toast.error('Image must be 2MB or smaller');
      return;
    }

    setSelectedFile(file);

    // Always show a fast local preview
    try {
      setImagePreview(URL.createObjectURL(file));
    } catch (e) { /* noop */ }

    // Try direct upload to Questera; gracefully fall back to base64
    try {
      setUploading(true);
      const url = await uploadViaQuestera(file, file.name);
      setUploadedUrl(url);
      toast.success('Image uploaded');
    } catch (err) {
      // Fallback to base64 for now
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result?.toString() || '';
          setUploadedUrl('');
          setImagePreview(dataUrl);
          toast('Using inline image (external upload unavailable)', { icon: 'ℹ️' });
        };
        reader.readAsDataURL(file);
      } catch (e) { /* noop */ }
    } finally {
      setUploading(false);
    }
  };

  const uploadViaQuestera = async (file, fileName) => {
    const API_URL = import.meta.env.VITE_QUESTERA_API_URL || 'https://api.questera.ai/api/upload-img';
    const API_KEY = import.meta.env.VITE_QUESTERA_API_KEY;
    const USER_ID = import.meta.env.VITE_QUESTERA_USER_ID;
    const TOKEN = import.meta.env.VITE_QUESTERA_TOKEN;

    if (!API_KEY || !USER_ID || !TOKEN) {
      throw new Error('Missing Questera credentials');
    }

    const fd = new FormData();
    fd.append('uploaded_file', file, fileName || file?.name || 'upload');

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'userId': USER_ID,
        'token': TOKEN,
      },
      body: fd,
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      // non-JSON response
    }

    const url = data?.url || data?.data?.url || data?.imageUrl || data?.fileUrl || data?.file_url;
    if (!url) {
      throw new Error('No URL in response');
    }
    return url;
  };


  const cropToSquare = (img) => {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = Math.max(0, (img.naturalWidth - side) / 2);
    const sy = Math.max(0, (img.naturalHeight - side) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);
    return canvas;
  };

  const handleCropSquare = async () => {
    if (!imagePreview) {
      toast.error('Select an image first');
      return;
    }
    try {
      setUploading(true);
      const img = new Image();
      const src = imagePreview;
      const result = await new Promise((resolve, reject) => {
        img.onload = () => resolve(cropToSquare(img));
        img.onerror = reject;
        img.src = src;
      });

      // Prefer JPEG for good balance; keep PNG if original was PNG
      const mime = selectedFile?.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise((resolve) => result.toBlob((b) => resolve(b), mime, 0.9));
      if (!blob) throw new Error('Failed to crop image');

      // Try Questera upload for the cropped image
      try {
        const url = await uploadViaQuestera(blob, `community-logo-cropped.${mime === 'image/png' ? 'png' : 'jpg'}`);
        setUploadedUrl(url);
        try { setImagePreview(URL.createObjectURL(blob)); } catch (e) { /* noop */ }
        toast.success('Cropped and uploaded');
      } catch (err) {
        // Fallback: inline data URL
        const dataUrl = result.toDataURL(mime, 0.9);
        setUploadedUrl('');
        setImagePreview(dataUrl);
        toast('Cropped (inline image used)', { icon: '✂️' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Community name is required');
      return;
    }

    try {
      setSubmitting(true);
      const resp = await api.post('/communities', {
        name: name.trim(),
        description: description.trim(),
        image: uploadedUrl || imagePreview || '',
      });

      const created = resp.data?.community;
      toast.success('Community created');

      if (created?._id) {
        try {
          await switchCommunity(created._id);
        } catch (err) {
          // Non-fatal
        }
      }

      navigate('/community-admin');
    } catch (error) {
      console.error('Failed to create community', error);
      toast.error(error.response?.data?.message || 'Failed to create community');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: theme.background }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 transition-colors"
            style={{ color: theme.textSecondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiPlusCircle} className="w-5 h-5" style={{ color: theme.primary }} />
            <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Create Community</h1>
          </div>
        </div>

        {/* Card */}
        <div
          className="border rounded-2xl p-6"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm mb-2" style={{ color: theme.textSecondary }}>
                Community Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Product Team"
                className="w-full px-4 py-3 rounded-xl outline-none border"
                style={{
                  backgroundColor: theme.surfaceLight,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm mb-2" style={{ color: theme.textSecondary }}>
                Description (optional)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                className="w-full px-4 py-3 rounded-xl outline-none border resize-none"
                style={{
                  backgroundColor: theme.surfaceLight,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm mb-2" style={{ color: theme.textSecondary }}>
                Community Image / Logo (optional)
              </label>
              <div className="flex items-start space-x-4">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center border overflow-hidden"
                  style={{ backgroundColor: theme.surfaceLight, borderColor: theme.border }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <SafeIcon icon={FiImage} className="w-8 h-8" style={{ color: theme.textSecondary }} />
                  )}
                </div>
                <div>
                  <label
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer"
                    style={{ backgroundColor: theme.surfaceLight, color: theme.text, border: `1px solid ${theme.border}` }}
                  >
                    <SafeIcon icon={FiUploadCloud} className="w-5 h-5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      PNG/JPG/WEBP, max 2MB. Square images look best.
                    </p>
                    <button
                      type="button"
                      disabled={!imagePreview || uploading}
                      onClick={handleCropSquare}
                      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs border"
                      style={{ borderColor: theme.border, color: theme.textSecondary }}
                    >
                      <SafeIcon icon={FiCrop} className="w-3 h-3" />
                      <span>Crop to square</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-5 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: submitting ? theme.primaryDark : theme.primary,
                  color: theme.background,
                  opacity: submitting ? 0.8 : 1,
                }}
              >
                {submitting ? 'Creating...' : uploading ? 'Uploading...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCommunity;

