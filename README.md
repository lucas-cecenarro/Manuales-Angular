# Proyecto: TodoTecno — Gestión de Productos

*Nombre del repositorio:* proyecto-angular-aied  
*Tipo de app:* PWA Angular de ecommerce (local)  
*Desarrollador:* Lucas Cecenarro y Nicolas Najsyk

---

## Funcionalidades actuales

-  Autenticación de usuarios (login y registro)
-  Catálogo de productos (con filtros por nombre, categoría y descripción)
-  Carrito de compras persistente por usuario (con localStorage)
-  Facturación automática: calcula total en ARS y USD
-  Exportación de facturas a *PDF* y *Excel*
-  Backend con Node.js
-  Estética profesional y diseño inspirado en sitios reales
-  Navbar con íconos y enlaces de navegación
-  Sección de contacto con enlaces a redes sociales

---

## Tecnologías utilizadas

- *Angular 17* (standalone components + Vite)
- *SCSS* para estilos personalizados
- *localStorage* para persistencia de carrito
- *jsPDF* y *xlsx* para exportación de reportes
- *API del BCRA* para tipo de cambio oficial USD/ARS

---

## Cómo iniciar el proyecto

bash
npm install
ng serve

> Accedé desde http://localhost:4200

---

## Estructura de carpetas principal


src/
├── app/
│   ├── components/         # Componentes visuales (navbar, preview factura, etc.)
│   ├── models/             # Interfaces como Producto, Usuario, ItemFactura
│   ├── pages/              # Secciones completas: productos, factura, contacto, login...
│   ├── pipes/              # Pipes personalizados (ej. filtroProducto)
│   ├── services/           # Lógica de negocio: productos, sesión, carrito
└── styles/                 # Estilos globales (ej. tipografía Montserrat)
