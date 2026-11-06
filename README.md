**Portal Estudiantil SII - Arquitectura BFF**
Este proyecto representa una modernización de la interfaz del Sistema Integral de Información (SII) del Instituto Tecnológico de Celaya. Utiliza un modelo Backend for Frontend (BFF) para intermediar de forma segura con los servidores de la institución, al tiempo que integra una base de datos propia para ofrecer funcionalidades adicionales creadas específicamente para la comunidad estudiantil.
Características Principales
* Panel de Inicio (Dashboard): Presenta un resumen inmediato de la situación del alumno, mostrando indicadores académicos como el promedio ponderado, materias aprobadas y una barra gráfica con el avance total de la carrera.
* Calificaciones en Tiempo Real: Permite el seguimiento del semestre en curso, desglosando las materias actuales junto con sus calificaciones parciales correspondientes.
* Kardex Histórico: Ofrece un registro completo de la trayectoria del estudiante, ordenado por periodos, con indicadores visuales de rendimiento para cada materia cursada.
* Módulo de Asesorías Estudiantiles: Una plataforma interactiva donde los alumnos pueden explorar clases de apoyo, visualizar en tiempo real los cupos disponibles e inscribirse, o bien, publicar sus propias sesiones de tutoría. El backend valida estrictamente la capacidad antes de permitir un nuevo registro.
---
**Stack Tecnológico**
Frontend: React / Vite (Desplegado en Vercel)
Backend (BFF): Node.js / Express (Desplegado en Render)
Base de Datos Extra: Supabase (PostgreSQL)
Autenticación: JSON Web Tokens (JWT) inyectados mediante cookies de estado.
*Estructura del Repositorio (Backend)*
El proyecto utiliza una arquitectura modular para mantener el código limpio y escalable:
```text
sii-backend-web-2026/
├── .env                      # Variables de entorno locales
├── index.js                  # Punto de entrada (Configuración de Express, CORS y middlewares)
├── package.json              # Dependencias del proyecto
└── src/
    ├── config/
    │   └── supabase.js       # Inicialización del cliente Supabase (usando Secret Key).
    ├── controllers/
    │   └── authController.js # Lógica de conexión al SII original y generación de JWT.
    └── routes/
        ├── auth.js           # Rutas de autenticación (login, logout).
        ├── student.js        # Rutas institucionales (kardex, calificaciones).
        └── extra.js          # Módulo de asesorías (listar, publicar, inscribir, validar cupos).
```
-
**Arquitectura de Seguridad y Cookies**
El sistema está diseñado con un enfoque estricto en la protección de la identidad del usuario y sus credenciales institucionales. El frontend jamás se comunica directamente con el servidor del SII; todas las peticiones son gestionadas e intermediadas por nuestro BFF.
Se implementó un sistema de sesión basado en Cookies HTTP de Estado para manejar el JWT, utilizando directivas estrictas de seguridad inter-dominio:
`httpOnly: true` (Mitigación XSS): Impide estrictamente que cualquier script (como `document.cookie`) lea el token en el navegador.
`secure: true` (Protección en tránsito): Garantiza que la cookie solo viaje a través de canales cifrados (HTTPS).
`sameSite: 'none'` (Habilitador Cross-Origin): Permite que la sesión fluya sin bloqueos de CORS entre el dominio del frontend (Vercel) y nuestro servidor API (Render).
De este modo, endpoints sensibles como el de "Publicar Asesoría" no dependen de un ID enviado manualmente, sino que extraen y decodifican la cookie segura del lado del servidor para autenticar la acción.
---
**Vistas del Proyecto**
Inicio
![Dashboard Principal](./images/Captura%20de%20pantalla%20(117).jpg)
Calificaciones
![Calificaciones del Semestre](./images/Captura%20de%20pantalla%20(116).png)
Kardex
![Historial Académico](./images/Captura%20de%20pantalla%20(115).png)
Asesorías
![Módulo de Asesorías](./images/Captura%20de%20pantalla%20(118).png)
