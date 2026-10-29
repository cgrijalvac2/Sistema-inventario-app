// Redirige las llamadas a /api hacia el backend (así el navegador no tiene problemas de CORS).
// Por defecto apunta a la API corriendo con el perfil "IIS Express" de Visual Studio.
// Si se ejecuta con el perfil "http", cambiar a http://localhost:5191
// (o definir la variable de entorno API_URL antes de "npm start").
const API_URL = process.env.API_URL || 'https://localhost:44329';

module.exports = {
  '/api': {
    target: API_URL,
    secure: false,
    changeOrigin: true,
  },
};
