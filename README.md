# 🚚 OptiRoute - Sistema de Gestión de Flotas y Rutas

📋 **Descripción**  
OptiRoute es un sistema backend **RESTful** desarrollado con **NestJS** y **TypeScript** para la gestión de flotas, conductores y solicitudes de transporte.  
Permite a los usuarios realizar pedidos, asignar vehículos y conductores, y seguir en tiempo real el estado de los viajes mediante GPS simulado.  

El sistema cuenta con:  
🔐 Autenticación y autorización basada en roles.  
🛡️ Seguridad con bcrypt, rate-limiting y validaciones. 
💬 Chat en tiempo real entre clientes y drivers via WebSockets.
📚 Documentación API con Swagger. 
⚡ Cache con Redis para optimizar consultas.  
📚 Documentación API con Swagger.  
📝 Logging.  
🧪 Testing unitario y end-to-end.  

---

## 🚀 Características principales  

👤 **Gestión de usuarios** con diferentes roles (admin, cliente, operador).  
🚗 **Administración de vehículos** y asignación a conductores.  
🧑‍✈️ **Gestión de conductores** con disponibilidad y datos de contacto.  
📦 **Solicitudes de transporte (Requests)** desde origen a destino.  
📍 **Seguimiento GPS simulado** para conocer la ubicación en tiempo real.  
📊 **Estados de pedidos**: pendiente, asignado, en viaje, completado, cancelado.  
⚡ **Cache Redis** para mejorar la velocidad en operaciones frecuentes.  
💬 **Chat automático** entre cliente y driver cuando se acepta una request.

🔐 **Protección de rutas** con Guards, roles y decoradores.  
📖 **Documentación interactiva** con Swagger UI.  

---

## 🛠️ Tecnologías usadas  

- **Node.js**  
- **NestJS**  
- **TypeScript**  
- **WebSocket**
- **PostgreSQL** (o la BD que prefieras)  
- **Redis** (cache)  
- **Bcrypt** (seguridad de contraseñas)  
- **Swagger (OpenAPI)** (documentación)  
- **Jest** (testing unitario y e2e)  
- **dotenv** (configuración .env)  
- **Rate limiting** (protección contra abusos)  
- **Winston / Logger interno de NestJS** (logging)  
- **Docker** (opcional para despliegue)  

---

