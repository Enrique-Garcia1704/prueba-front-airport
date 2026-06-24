# Airport Explorer

Una aplicación web moderna y accesible para buscar, explorar y guardar información detallada sobre aeropuertos en todo el mundo.

## 🚀 Características Principales

- **Búsqueda Avanzada:** Busca aeropuertos por código IATA, ICAO, País, Región o Continente.
- **Filtros Locales:** Ordena y filtra los resultados obtenidos para encontrar fácilmente la información.
- **Modo Oscuro / Claro:** Alterna entre temas visuales para mayor comodidad.
- **Accesibilidad (A11y):** Totalmente navegable por teclado (`Tab`, `Enter`, `Escape`), optimizado con HTML semántico, `aria-labels` y soporte para lectores de pantalla.
- **Mapas Integrados:** Visualiza la ubicación exacta de los aeropuertos en mapas interactivos (Leaflet).
- **Estadísticas Generales:** Visualiza gráficas y datos analíticos a partir de los resultados de búsqueda.
- **Historial y Favoritos:** Guarda tus búsquedas recientes y marca aeropuertos como favoritos (usando LocalStorage).

## 🛠️ Tecnologías

Este proyecto está construido con:

- [React 18](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Leaflet](https://leafletjs.com/) & React-Leaflet
- [Lucide React](https://lucide.dev/) (Iconos)

## ⚙️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (versión 16.0 o superior recomendada)
- `npm` (viene preinstalado con Node.js) o `yarn`

## 📦 Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/Enrique-Garcia1704/prueba-front-airport.git
   cd prueba-front-airport
   ```

2. **Instala las dependencias:**
   Ejecuta el siguiente comando en la raíz del proyecto para descargar todas las librerías necesarias:
   ```bash
   npm install
   ```

3. **Configura las Variables de Entorno:**
   Para poder realizar consultas, la aplicación utiliza la API de "API-Ninjas". 
   Crea un archivo llamado `.env` en la raíz del proyecto y añade tu API Key:
   ```env
   VITE_API_KEY=tu_api_key_aqui
   ```
   *(Nota: Puedes obtener una clave gratuita registrándote en [API Ninjas](https://api-ninjas.com/))*

## 🚀 Ejecución en Desarrollo

Para levantar el servidor de desarrollo local y previsualizar la aplicación:

```bash
npm run dev
```

Abre tu navegador web y visita la URL que te mostrará la terminal (generalmente es `http://localhost:5173`). Cualquier cambio en el código se reflejará automáticamente en el navegador gracias a Vite.

## 🏗️ Construcción para Producción

Para compilar la aplicación y prepararla para un entorno de producción (Hosting web):

```bash
npm run build
```

Los archivos estáticos optimizados y minificados se generarán dentro de la carpeta `dist/`. Si deseas previsualizar esta compilación final de producción localmente, puedes usar:

```bash
npm run preview
```

## 🤝 Accesibilidad Integrada

Este proyecto fue diseñado teniendo en mente a todos los usuarios:
- Contornos visibles al navegar exclusivamente con el tabulador (`:focus-visible`).
- Tarjetas y modales completamente interactivos usando el teclado.
- Estructura HTML5 Semántica (`<main>`, `<header>`, `<section>`).
- Atributos `aria-hidden` en elementos puramente visuales y `aria-label` en botones interactivos.
