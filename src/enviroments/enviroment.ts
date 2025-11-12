// src/environments/environment.ts
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api'
};

// src/environments/environment.prod.ts
export const environmentProd = {
    production: true,
    apiUrl: 'https://tu-dominio.com/api' // Cambia esto en producción
};