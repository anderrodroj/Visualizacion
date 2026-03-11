# ¿Dónde están los niños? — Educación en Colombia

Un proyecto de *data storytelling* que narra la evolución de la educación preescolar, básica y media en Colombia entre 2011 y 2024 a través de visualizaciones interactivas.

---

## Vista previa

> *"En Vaupés, solo el 53 % de los niños en edad escolar está en el sistema educativo. El otro 47 % se quedó afuera."*

La historia recorre cinco capítulos:

| # | Capítulo | Qué muestra |
|---|----------|-------------|
| 1 | **La Brecha** | Cobertura neta por departamento (2024) — de Bogotá al Amazonas |
| 2 | **La Tendencia** | Evolución nacional 2011–2024 y el impacto del COVID-19 |
| 3 | **La Paradoja COVID** | La repitencia se duplicó mientras la deserción caía |
| 4 | **La Sombra** | Repitencia nacional en máximo histórico (10.2 % en 2023) |
| 5 | **Los que se van** | Departamentos con mayor deserción escolar en 2024 |

---

## Tecnologías

- **HTML5 / CSS3** — diseño narrativo tipo *scrollytelling*, animaciones con `IntersectionObserver`
- **D3.js v7** — gráficos de barras horizontales, líneas de tendencia y scatter plots
- **JavaScript (ES6+)** — sin frameworks, código vanilla modular
- **Google Fonts** — tipografía Georgia + system-ui

---

## Estructura del proyecto

```
src/
├── index.html   # Estructura narrativa completa (6 secciones)
├── main.js      # Lógica de visualizaciones D3 y animaciones
├── style.css    # Estilos: dark theme, responsive, animaciones scroll
├── data.js      # Dataset preprocesado como window.EDU_DATA
└── data.json    # Copia JSON del dataset procesado
```

---

## Datos

**Fuente:** Ministerio de Educación Nacional de Colombia (MEN)  
**Dataset:** *Estadísticas en Educación Preescolar, Básica y Media por Departamento*  
**Período:** 2011 – 2024  
**Cobertura:** 34 departamentos · 37 indicadores · 462 registros

Indicadores utilizados:
- Cobertura neta y bruta (total y por nivel)
- Tasa de deserción
- Tasa de repitencia
- Tasa de aprobación y reprobación

---

## Cómo ejecutar

Abre `src/index.html` directamente en un navegador moderno.  
No requiere servidor ni dependencias instaladas — D3 se carga desde CDN.

```bash
# Opcionalmente, con un servidor local:
npx serve src

---

## Licencia

Datos públicos del MEN · Código bajo licencia MIT.
