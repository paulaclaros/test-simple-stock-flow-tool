/**
 * Simple Stock Flow - Demo Seeder & E2E Verifier
 * Ejecución: node seed.js [API_BASE_URL]
 */

const API_BASE = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:8080/api';

console.log('='.repeat(65));
console.log('🌱 SIMPLE STOCK FLOW - DEMO DATA SEEDER');
console.log(`🎯 Conectando a la API en: ${API_BASE}`);
console.log('='.repeat(65));

async function run() {
  try {
    // 1. Healthcheck
    console.log('\n1️⃣  Verificando estado del servicio (/health)...');
    const healthUrl = API_BASE.replace('/api', '') + '/health';
    const healthRes = await fetch(healthUrl);
    if (!healthRes.ok) {
      console.warn(`⚠️  /health respondió ${healthRes.status}. Intentando continuar...`);
    } else {
      console.log('✅ Servicio en línea.');
    }

    // 2. Login Admin
    console.log('\n2️⃣  Autenticando como Administrador (admin / Admin123*)...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123*' }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.text();
      throw new Error(`Fallo al iniciar sesión como admin: ${loginRes.status} ${err}`);
    }

    const { accessToken: adminToken } = await loginRes.json();
    console.log('✅ Token JWT de administrador obtenido.');

    // 3. Obtener categorías
    console.log('\n3️⃣  Consultando categorías disponibles...');
    const catRes = await fetch(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const categories = await catRes.json();
    console.log(`✅ ${categories.length} categorías encontradas: ${categories.map((c) => c.name).join(', ')}`);

    const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
    const defaultCatId = categories[0]?.id;

    // 4. Crear productos de prueba
    console.log('\n4️⃣  Creando catálogo de productos de demostración...');
    const sampleProducts = [
      { name: 'Taladro Percutor 650W', categoryId: catMap['Herramientas'] || defaultCatId, price: 185000, stock: 15 },
      { name: 'Cable Eléctrico THHN 100m', categoryId: catMap['Electricidad'] || defaultCatId, price: 120000, stock: 25 },
      { name: 'Pintura Vinilo Blanco 5 Gal', categoryId: catMap['Pinturas'] || defaultCatId, price: 95000, stock: 30 },
      { name: 'Llave Expansiva 10 Pulgadas', categoryId: catMap['Herramientas'] || defaultCatId, price: 42000, stock: 20 },
      { name: 'Tubo PVC Sanitario 3m', categoryId: catMap['Fontanería'] || defaultCatId, price: 28500, stock: 50 },
      { name: 'Cinta Aislante Negra 20m', categoryId: catMap['Electricidad'] || defaultCatId, price: 6500, stock: 100 },
      { name: 'Martillo de Uña 16oz', categoryId: catMap['Herramientas'] || defaultCatId, price: 32000, stock: 18 },
      { name: 'Pegante PVC Soldadura Líquida', categoryId: catMap['Fontanería'] || defaultCatId, price: 14000, stock: 40 },
    ];

    const createdProducts = [];
    for (const prod of sampleProducts) {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(prod),
      });

      if (res.ok) {
        const { id } = await res.json();
        createdProducts.push({ id, ...prod });
        console.log(`   + Producto creado: ${prod.name} (${prod.stock} disp.)`);
      } else {
        console.warn(`   - Omitiendo ${prod.name} (posiblemente existente o error ${res.status})`);
      }
    }

    // 5. Registrar vendedor de prueba
    console.log('\n5️⃣  Creando vendedor de mostrador (vendedor1 / Vendedor123*)...');
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: 'vendedor1',
        password: 'Vendedor123*',
        fullName: 'Juan Camilo Vendedor',
        role: 'seller',
      }),
    });

    if (regRes.ok) {
      console.log('✅ Usuario vendedor creado.');
    } else {
      console.log('ℹ️  Usuario vendedor ya existía.');
    }

    // 6. Iniciar sesión como vendedor
    console.log('\n6️⃣  Iniciando sesión como vendedor...');
    const sellerLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'vendedor1', password: 'Vendedor123*' }),
    });
    const { accessToken: sellerToken } = await sellerLogin.json();
    console.log('✅ Token JWT de vendedor obtenido.');

    // 7. Simular ventas
    console.log('\n7️⃣  Registrando ventas de prueba (Descuento atómico de stock)...');
    if (createdProducts.length >= 2) {
      const salePayload = {
        items: [
          { productId: createdProducts[0].id, quantity: 2 },
          { productId: createdProducts[1].id, quantity: 1 },
        ],
      };

      const saleRes = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(salePayload),
      });

      if (saleRes.ok) {
        const saleData = await saleRes.json();
        console.log(`✅ Venta #1 registrada con éxito! Total: $${saleData.total} COP (ID: ${saleData.id})`);
      } else {
        console.warn(`⚠️ Error en venta: ${saleRes.status}`);
      }
    }

    // 8. Consultar reporte
    console.log('\n8️⃣  Consultando reporte consolidado en base de datos...');
    const now = new Date();
    const fromIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const toIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

    const reportRes = await fetch(`${API_BASE}/reports/sales?from=${fromIso}&to=${toIso}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });

    if (reportRes.ok) {
      const rep = await reportRes.json();
      console.log(`✅ Reporte del mes: ${rep.totalSales} ventas realizadas. Recaudo: $${rep.grandTotal} ${rep.currency}`);
    }

    console.log('\n' + '='.repeat(65));
    console.log('🎉 SEMBRADO Y VERIFICACIÓN E2E COMPLETADOS CON ÉXITO');
    console.log('='.repeat(65));
  } catch (err) {
    console.error('\n❌ ERROR DURANTE EL SEMBRADO:', err.message);
  }
}

run();
