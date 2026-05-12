/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        // Cloudinary: almacenamiento de imágenes de productos del menú
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        // mixkit: audio de notificaciones (no se usa para imagenes pero por consistencia)
        protocol: 'https',
        hostname: 'assets.mixkit.co',
      },
    ],
  },
  // Permitir que el frontend se comunique con el backend en desarrollo
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
