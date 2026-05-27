
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/docu--stream-000?style=for-the-badge&logo=markdown&logoColor=white">
    <img alt="docu-stream" src="https://img.shields.io/badge/docu--stream-000?style=for-the-badge&logo=markdown&logoColor=white">
  </picture>
</p>

<p align="center">
  <strong>Editor de documentación Markdown con preview en vivo, análisis de código con IA e importación de repositorios GitHub.</strong>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="i18n" src="https://img.shields.io/badge/i18n-EN%20%7C%20ES-0093D0?logo=localize&logoColor=white">
</p>

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Características](#características)
- [Empezar](#empezar)
- [Scripts](#scripts)
- [Despliegue](#despliegue)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 + TypeScript 5.9 |
| **Bundler** | Vite 7.3 |
| **Estilos** | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| **Animaciones** | Framer Motion 12 |
| **Markdown** | react-markdown 10 + remark-gfm |
| **Iconos** | Lucide React |
| **i18n** | i18next 26 + react-i18next 17 |
| **Fuente** | Geist Variable (Vercel) |
| **Linting** | ESLint 9 (flat config) + Prettier 3 |
| **Despliegue** | Vercel (SPA rewrites) |

---

## Estructura del Proyecto

```
docu-stream/
├── public/
│   ├── logo.png
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   ├── AISettingsModal.tsx    # Configuración del proveedor IA con presets
│   │   │   └── RepoImporter.tsx       # Importador y escáner de repositorios GitHub
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx         # Textarea con pegado inteligente y drag-drop
│   │   │   ├── CodePasteModal.tsx     # Modal para pegar código con selector de lenguaje
│   │   │   ├── FileImporter.tsx       # Importación drag-and-drop de archivos locales
│   │   │   ├── MarkdownToolbar.tsx    # Barra de formateo (headings, bold, listas, etc.)
│   │   │   └── SearchBar.tsx          # Búsqueda inline con navegación entre resultados
│   │   ├── layout/
│   │   │   ├── Banners.tsx            # Banners de estado (error IA, restauración, progreso)
│   │   │   ├── EditorArea.tsx         # Layout editor + preview (split/tabs)
│   │   │   └── Header.tsx             # Barra superior con todas las acciones
│   │   ├── preview/
│   │   │   ├── MarkdownPreview.tsx    # Renderizado HTML en vivo desde Markdown
│   │   │   └── TableOfContents.tsx    # Tabla de contenidos lateral con scroll
│   │   ├── sidebar/
│   │   │   └── blueprints/            # 14 plantillas en 5 categorías
│   │   ├── ui/                        # Componentes shadcn/ui (button, input, sheet, etc.)
│   │   └── theme-provider.tsx         # Contexto de tema claro/oscuro con persistencia
│   ├── hooks/
│   │   ├── use-ai-settings.ts         # Configuración IA persistida en localStorage
│   │   ├── use-app-actions.ts         # Acciones centralizadas de la app
│   │   ├── use-autosave.ts           # Auto-guardado con debounce (500ms)
│   │   └── use-mobile.ts             # Detección de viewport móvil
│   ├── lib/
│   │   ├── ai-service.ts             # Comunicación con APIs IA (con fallback local)
│   │   ├── constants.ts              # Constantes y contenido Markdown por defecto
│   │   ├── file-utils.ts             # Análisis de código, parsing, generación de docs
│   │   ├── github-service.ts         # API de GitHub (tree, contenido, filtrado)
│   │   ├── i18n.ts                   # Configuración de i18next
│   │   └── utils.ts                  # Utilidad cn() (clsx + tailwind-merge)
│   ├── locales/
│   │   ├── en.json                   # Traducciones al inglés
│   │   └── es.json                   # Traducciones al español
│   ├── App.tsx                       # Componente raíz que orquesta toda la UI
│   ├── index.css                     # Estilos globales, tema y clases del preview
│   └── main.tsx                      # Punto de entrada
├── vercel.json                        # Config para deploy en Vercel
├── vite.config.ts                     # Vite + React + Tailwind + alias @
├── tsconfig.json / tsconfig.*.json   # Configuración de TypeScript
├── components.json                    # Registro de shadcn/ui
└── package.json                       # Dependencias y scripts
```

---

## Características

###  Editor Markdown

- Edición con **preview en vivo** en modo split, solo editor o solo preview
- **14 plantillas** predefinidas (Structure, Infra, Backend, Ops, Docs) para comenzar rápido
- **Pegado inteligente** que detecta automáticamente si pegas código y lo envuelve en bloques con el lenguaje correcto
- **Barra de herramientas** con 14 acciones de formato (headings, negrita, listas, tablas, etc.)
- **Tabla de contenidos** automática extraída de los headings del documento
- **Búsqueda inline** con Ctrl+F y navegación entre resultados
- **Auto-guardado** con restauración de sesión

###  Integración con IA

- Conecta con cualquier API compatible con OpenAI: **Groq, OpenAI, OpenRouter, Ollama, LM Studio**
- **Reestructuración inteligente**: envía el contenido del editor a la IA para generar documentación profesional
- **Descripción de archivos**: la IA analiza cada archivo y genera una descripción precisa de su propósito
- **Fallback local automático**: si la API falla o no está configurada, genera documentación con análisis estático del código
- Detección automática de **Vercel**: si estás en producción, bloquea automáticamente los proveedores locales (Ollama, LM Studio)

###  Importación de Archivos

- **Drag-and-drop** de archivos locales al editor
- **Importación desde portapapeles**
- Detección automática del lenguaje de programación
- Estructuración inteligente dividiendo el código en secciones por función/clase

###  Importación de Repositorios GitHub

- Escanea el árbol completo del repositorio vía GitHub API
- Árbol de archivos navegable con selección individual o por carpeta
- **Filtro de búsqueda** para encontrar archivos rápidamente en repos grandes
- **Modo Compacto** (tablas resumidas con descripciones) o **Modo Detallado** (por archivo)
- **Exclusión automática** de archivos de librerías (shadcn/ui, tests, generated)
- **Análisis del stack tecnológico** detecta frameworks, dependencias clave y arquitectura
- **Relaciones entre archivos** muestra qué archivos importa y quién lo usa

###  Internacionalización

- Soporte completo para **inglés** y **español**
- Traducciones de toda la interfaz, incluyendo tooltips, modales y contenido por defecto

###  Personalización

- **Tema claro/oscuro** con atajo de teclado (tecla `D`)
- Diseño **responsivo** con vista adaptada para móviles
- **5 proveedores IA** preconfigurados listos para usar

---

## Empezar

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Typecheck
npm run typecheck

# Linting
npm run lint

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

---

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo Vite |
| `npm run build` | Typecheck + build de producción |
| `npm run lint` | Ejecuta ESLint en todo el proyecto |
| `npm run format` | Formatea código con Prettier |
| `npm run typecheck` | Verifica tipos sin emitir archivos |
| `npm run preview` | Vista previa local del build |

---

## Despliegue

La app está lista para desplegar en **Vercel** con un solo clic:

```bash
# Usando Vercel CLI
vercel --prod

# O conectando el repositorio directamente en vercel.com
```

> ⚠️ Nota: Si usas la IA en producción, asegúrate de configurar un proveedor cloud (Groq, OpenAI, OpenRouter) ya que Ollama y LM Studio requieren acceso local.

---

<p align="center">
  <a href="https://edit-code-md.vercel.app/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/_Abrir_aplicación-000?style=for-the-badge">
      <img alt="Abrir aplicación" src="https://img.shields.io/badge/_Abrir_aplicación-000?style=for-the-badge">
    </picture>
  </a>
</p>

<p align="center">
  <sub>Built with React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · i18next</sub>
</p>
