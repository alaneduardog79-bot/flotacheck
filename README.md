# FlotaCheck 🔧
### Control de Mantenimiento de Maquinaria

---

## ¿Cómo publicar la app en internet? (Paso a paso)

### PASO 1 — Crea una cuenta en GitHub
1. Ve a **github.com**
2. Clic en "Sign up" y crea tu cuenta gratis

---

### PASO 2 — Sube el proyecto a GitHub
1. Una vez dentro de GitHub, clic en **"New repository"** (botón verde)
2. Nombre: `flotacheck`
3. Deja todo por defecto y clic en **"Create repository"**
4. En la página siguiente verás instrucciones. Sigue las de **"upload an existing file"**
5. Arrastra TODOS los archivos de esta carpeta al navegador
6. Clic en **"Commit changes"**

---

### PASO 3 — Despliega en Vercel
1. Ve a **vercel.com**
2. Clic en **"Sign up"** → elige **"Continue with GitHub"**
3. Clic en **"Add New Project"**
4. Selecciona el repositorio **flotacheck**
5. Vercel detecta React automáticamente — clic en **"Deploy"**
6. En 2 minutos tendrás tu link: `flotacheck.vercel.app`

---

### PASO 4 — Comparte el link
- Envía el link por WhatsApp a tus operarios
- En el celular: abre el link → menú del navegador → **"Agregar a pantalla de inicio"**
- ¡Se instala como una app nativa!

---

## Accesos por defecto

| Usuario       | Rol        | PIN  |
|---------------|------------|------|
| Operario 1    | operario   | 1234 |
| Supervisor    | supervisor | 9999 |

> ⚠️ El supervisor puede cambiar usuarios y PINs desde la app (ícono ⚙️)

---

## Funciones de la app

- ✅ Login con PIN por usuario
- 🔧 Registro de servicios: 250 / 500 / 1,000 / 2,000 hrs
- 📋 Checklist táctil por intervalo
- ⚠️ Alertas automáticas de servicio próximo
- 📊 Reportes y cumplimiento
- 🗂️ Historial permanente
- ⚙️ Gestión de equipos y usuarios (supervisor)
- 📱 Instalable como app en celular (PWA)

---

## Estructura del proyecto

```
flotacheck/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js        ← Toda la lógica de la app
│   ├── index.js      ← Punto de entrada
│   └── index.css     ← Estilos base
└── package.json
```
