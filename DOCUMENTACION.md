# docu-stream

Aplicacion web de edicion de Markdown con vista previa en vivo, integracion con IA para generar documentacion, importacion de repositorios GitHub, plantillas (blueprints), internacionalizacion (en/es) y soporte para tema claro/oscuro. Construida con React 19, TypeScript, Vite, Tailwind CSS v4 y shadcn/ui.

## Jerarquia de carpetas

```
docu-stream/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── ai/
│   │   │   ├── AISettingsModal.tsx
│   │   │   └── RepoImporter.tsx
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── CodePasteModal.tsx
│   │   │   ├── FileImporter.tsx
│   │   │   ├── MarkdownToolbar.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── layout/
│   │   │   ├── Banners.tsx
│   │   │   ├── EditorArea.tsx
│   │   │   └── Header.tsx
│   │   ├── preview/
│   │   │   ├── MarkdownPreview.tsx
│   │   │   └── TableOfContents.tsx
│   │   ├── sidebar/
│   │   │   ├── BlueprintSidebar.tsx
│   │   │   └── blueprints/
│   │   │       ├── category-icons.tsx
│   │   │       ├── CategorySection.tsx
│   │   │       ├── data.tsx
│   │   │       └── types.ts
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── tooltip.tsx
│   │   └── theme-provider.tsx
│   ├── data/
│   ├── hooks/
│   │   ├── use-ai-settings.ts
│   │   ├── use-app-actions.ts
│   │   ├── use-autosave.ts
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── ai-service.ts
│   │   ├── constants.ts
│   │   ├── file-utils.ts
│   │   ├── github-service.ts
│   │   ├── i18n.ts
│   │   └── utils.ts
│   ├── locales/
│   │   ├── en.json
│   │   └── es.json
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── .prettierignore
├── .prettierrc
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Archivos de codigo fuente

### Punto de entrada

#### `src/main.tsx`
**Proposito:** Punto de entrada de la aplicacion. Monta el componente React con StrictMode, ThemeProvider y TooltipProvider.

#### `index.html`
**Proposito:** HTML de entrada para el SPA de Vite, contiene el div raiz y la referencia al script principal.

---

### Aplicacion principal

#### `src/App.tsx`
**Proposito:** Componente raiz que orquesta toda la UI del editor, gestionando el estado de contenido, sidebar, modos de vista, modales, configuracion de IA, autosave y cambio de idioma.

#### `src/index.css`
**Proposito:** Estilos globales con variables de tema Tailwind (claro/oscuro), estilos base, clases de tipografia prose para preview de markdown y scrollbar personalizado.

---

### Componentes - IA

#### `src/components/ai/AISettingsModal.tsx`
**Proposito:** Modal para configurar ajustes del proveedor de IA (URL de API, clave, modelo) con presets para Ollama, LM Studio, Groq, OpenAI y OpenRouter.

#### `src/components/ai/RepoImporter.tsx`
**Proposito:** Wizard multi-paso para importar repositorios de GitHub: escanea el arbol del repo, permite seleccionar archivos via vista de arbol interactiva y opcionalmente los estructura con IA.

---

### Componentes - Editor

#### `src/components/editor/CodeEditor.tsx`
**Proposito:** Textarea principal de edicion markdown con deteccion inteligente de pegado (auto-envuelve codigo en bloques fenced), soporte de drag-and-drop de archivos y estadisticas de lineas/palabras/buffer.

#### `src/components/editor/CodePasteModal.tsx`
**Proposito:** Modal para pegar codigo manualmente con nombre de archivo opcional, seleccion de lenguaje (auto-detectar o manual) y atajo de teclado (Ctrl+Enter) para insertar.

#### `src/components/editor/FileImporter.tsx`
**Proposito:** Modal para importar archivos via drag-and-drop, selector de archivos o pegado del portapapeles, con gestion de lista de archivos y conversion a markdown al importar.

#### `src/components/editor/MarkdownToolbar.tsx`
**Proposito:** Barra de herramientas de formateo con botones para headings, negrita, italica, tachado, codigo, links, listas, tablas y reglas horizontales, cada uno con tooltip y atajos de teclado.

#### `src/components/editor/SearchBar.tsx`
**Proposito:** Barra de busqueda inline para el editor con conteo de coincidencias, navegacion siguiente/anterior y soporte de atajos (Ctrl+F, Escape).

---

### Componentes - Layout

#### `src/components/layout/Banners.tsx`
**Proposito:** Banners de notificacion para errores de IA, prompt de restauracion desde autosave e indicador de estado de procesamiento de IA.

#### `src/components/layout/EditorArea.tsx`
**Proposito:** Componente de layout que renderiza los paneles de editor y preview en modos split/editor-only/preview-only, usando tabs en movil.

#### `src/components/layout/Header.tsx`
**Proposito:** Barra superior con todos los botones de accion: toggle sidebar, pegado de clipboard, importacion de archivos/repos, estructura IA, busqueda, TOC, ciclo de modo de vista, copiar (MD/HTML), limpiar, exportar, toggle tema y toggle idioma.

---

### Componentes - Preview

#### `src/components/preview/MarkdownPreview.tsx`
**Proposito:** Renderiza contenido markdown como HTML estilizado usando react-markdown con soporte GFM, agregando IDs slugificados a los headings para navegacion del TOC.

#### `src/components/preview/TableOfContents.tsx`
**Proposito:** Extrae headings (h1-h4) del contenido markdown y renderiza una tabla de contenidos clickeable en el sidebar con indentacion por nivel de heading.

---

### Componentes - Sidebar

#### `src/components/sidebar/BlueprintSidebar.tsx`
**Proposito:** Contenedor del sidebar izquierdo que organiza plantillas blueprint por categoria con secciones colapsables y lista scrolleable.

#### `src/components/sidebar/blueprints/category-icons.tsx`
**Proposito:** Mapea nombres de categorias (Structure, Infra, Backend, Ops, Docs) a sus iconos Lucide correspondientes y exporta la lista ordenada de categorias.

#### `src/components/sidebar/blueprints/CategorySection.tsx`
**Proposito:** Componente de seccion colapsable para una categoria de blueprint, renderizando su icono, etiqueta, conteo de items y una lista animada de items clickeables.

#### `src/components/sidebar/blueprints/data.tsx`
**Proposito:** Archivo de datos estatico con todas las definiciones de plantillas blueprint (12 templates) en 5 categorias con contenido markdown completo para cada una.

#### `src/components/sidebar/blueprints/types.ts`
**Proposito:** Definiciones de tipos TypeScript para Blueprint (id, label, icon, category, content) y BlueprintSidebarProps.

---

### Componentes - UI (shadcn/ui)

#### `src/components/ui/button.tsx`
**Proposito:** Componente Button reutilizable con multiples variantes (default, outline, ghost, destructive, link) y tamanos, construido con class-variance-authority.

#### `src/components/ui/card.tsx`
**Proposito:** Familia de componentes Card (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter) para contenedores de contenido estructurado.

#### `src/components/ui/input.tsx`
**Proposito:** Componente Input estilizado que envuelve un input HTML nativo con tematizacion consistente y estados de foco.

#### `src/components/ui/scroll-area.tsx`
**Proposito:** Componentes ScrollArea y ScrollBar construidos sobre Radix UI para contenedores scrolleables con estilo personalizado.

#### `src/components/ui/separator.tsx`
**Proposito:** Componente Separator (horizontal/vertical) construido sobre Radix UI para divisores visuales.

#### `src/components/ui/sheet.tsx`
**Proposito:** Familia de componentes Sheet (panel deslizante) construidos sobre Radix UI Dialog, soportando lados top/right/bottom/left con transiciones animadas.

#### `src/components/ui/sidebar.tsx`
**Proposito:** Biblioteca completa de componentes sidebar construida sobre Radix UI con contexto provider, estados colapsables, soporte mobile via sheet, atajo de teclado y numerosos sub-componentes.

#### `src/components/ui/skeleton.tsx`
**Proposito:** Componente Skeleton placeholder con animacion pulse para estados de carga.

#### `src/components/ui/tabs.tsx`
**Proposito:** Familia de componentes Tabs (Tabs, TabsList, TabsTrigger, TabsContent) con variantes default y line, construidos sobre Radix UI.

#### `src/components/ui/tooltip.tsx`
**Proposito:** Familia de componentes Tooltip (TooltipProvider, Tooltip, TooltipTrigger, TooltipContent) construidos sobre Radix UI con soporte de flecha y animacion.

#### `src/components/theme-provider.tsx`
**Proposito:** Provider de contexto de tema que gestiona el cambio claro/oscuro/sistema con persistencia en localStorage, deteccion de preferencia del sistema, atajo de teclado (tecla D) y sincronizacion entre tabs.

---

### Hooks

#### `src/hooks/use-ai-settings.ts`
**Proposito:** Hook personalizado para gestionar configuracion de IA (URL de API, clave, modelo) con persistencia en localStorage y flag de estado de configuracion.

#### `src/hooks/use-app-actions.ts`
**Proposito:** Hook que centraliza todos los handlers de accion de la app: inyeccion de blueprint, importacion de archivos, pegado inteligente, pegado de clipboard, estructuracion IA, exportar, limpiar y copiar (MD/HTML).

#### `src/hooks/use-autosave.ts`
**Proposito:** Hook que auto-guarda el contenido del editor en localStorage con debouncing (500ms), capacidad de restauracion y funcion de limpieza.

#### `src/hooks/use-mobile.ts`
**Proposito:** Hook que detecta viewport movil (por debajo de 768px) usando un listener matchMedia para decisiones de layout responsivo.

---

### Librerias

#### `src/lib/ai-service.ts`
**Proposito:** Servicio de integracion IA que envia codigo/contenido a una API compatible con OpenAI para generacion de documentacion estructurada, con estimacion de tokens, truncado de input y procesamiento por chunks para archivos grandes.

#### `src/lib/constants.ts`
**Proposito:** Define el tipo ViewMode y la funcion getDefaultContent que genera el contenido markdown de bienvenida inicial usando traducciones i18n.

#### `src/lib/file-utils.ts`
**Proposito:** Utilidades para deteccion de lenguaje de codigo, split inteligente por lenguaje (TS/JS, Python, Go, Rust, SQL), conversion archivo-a-markdown, limpieza de badges de README y extraccion de codigo esencial para archivos grandes.

#### `src/lib/github-service.ts`
**Proposito:** Servicio de integracion con la API de GitHub para parsear URLs de repos, obtener arboles de archivos, filtrar archivos de codigo y descargar contenidos individuales o multiples con seguimiento de progreso.

#### `src/lib/i18n.ts`
**Proposito:** Configuracion de i18next con traducciones en ingles y espanol, deteccion de idioma del navegador y preferencia de idioma persistida en localStorage.

#### `src/lib/utils.ts`
**Proposito:** Funcion utilitaria `cn` que fusiona clases CSS de Tailwind usando clsx y tailwind-merge.

---

### Localizacion

#### `src/locales/en.json`
**Proposito:** Cadenas de traduccion en ingles para todas las etiquetas UI, placeholders, textos de botones y contenido por defecto de la aplicacion.

#### `src/locales/es.json`
**Proposito:** Cadenas de traduccion en espanol para todas las etiquetas UI, placeholders, textos de botones y contenido por defecto de la aplicacion.

---

## Archivos de configuracion

#### `package.json`
```json
{
  "name": "docu-stream",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "format": "prettier --write \"**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "@fontsource-variable/geist": "^5.2.8",
    "@tailwindcss/vite": "^4.2.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.38.0",
    "i18next": "^26.0.3",
    "i18next-browser-languagedetector": "^8.2.1",
    "lucide-react": "^1.7.0",
    "radix-ui": "^1.4.3",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-i18next": "^17.0.2",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "shadcn": "^4.1.2",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.1",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/node": "^24.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.2.0",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^16.5.0",
    "prettier": "^3.8.1",
    "prettier-plugin-tailwindcss": "^0.7.2",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.57.1",
    "vite": "^7.3.1"
  }
}
```

#### `vite.config.ts`
```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

#### `tsconfig.json`
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### `tsconfig.app.json`
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

#### `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### `eslint.config.js`
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
```

#### `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

#### `.prettierrc`
```json
{
  "endOfLine": "lf",
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "src/index.css",
  "tailwindFunctions": ["cn", "cva"]
}
```

#### `.prettierignore`
```
node_modules/
coverage/
.pnpm-store/
pnpm-lock.yaml
package-lock.json
pnpm-lock.yaml
yarn.lock
```

#### `.gitignore`
```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```
