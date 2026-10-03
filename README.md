# test-simple-stock-flow-tool

> **Prueba Técnica SDD · Ficha ADSO 3413974**  
> **Aprendiz:** Paula Claros ([`paulaclaros`](https://github.com/paulaclaros))  
> **Tecnología:** Node.js / JavaScript (Cliente HTTP puro)  
> **Fecha:** 2026-10-03  

---

## 📌 1. Descripción de la Herramienta

Este repositorio contiene la **herramienta automatizada de sembrado y verificación** de *Simple Stock Flow* (`seed.js`).

### Regla Fundamental del Spec
* **Cliente HTTP Puro:** La herramienta **nunca** se conecta directamente a la base de datos SQL. Interactúa exclusivamente a través de los endpoints públicos de la API (`/api/auth/login`, `/api/products`, `/api/sales`).

---

## 🚀 2. Uso de la Herramienta

### Sembrado Automático de Datos de Demostración:
```bash
# Ejecutar script con Node.js
node seed.js
```

### Qué realiza el script:
1. Autentica como `admin` obteniendo token JWT.
2. Consulta categorías base.
3. Siembra productos del catálogo ferretero (Taladros, Cables, Pinturas, Llaves).
4. Registra ventas iniciales simulando el comportamiento de vendedores.
5. Imprime un reporte resumen confirmando la salud del sistema.
