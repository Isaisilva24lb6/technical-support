// test-parser.js
// Script para probar el NextepParser con un archivo real

const path = require('path');
const { NextepParser } = require('./server/parsers/nextepParser');

async function testParser() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 Test del NextepParser                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Buscar un archivo de prueba en data/uploads/empleados/
  const testFile = process.argv[2] || './data/uploads/empleados/empleados_1763789660145.xlsx';
  
  console.log(`📁 Archivo a parsear: ${testFile}\n`);
  
  try {
    const parser = new NextepParser();
    const result = await parser.parse(testFile);
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESULTADO DEL PARSEO                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ Success:', result.success);
    console.log('\n📅 Período:');
    console.log('  -', 'Archivo:', result.periodo?.nombre_archivo);
    console.log('  -', 'Inicio:', result.periodo?.fecha_inicio?.toLocaleDateString());
    console.log('  -', 'Fin:', result.periodo?.fecha_fin?.toLocaleDateString());
    
    console.log('\n📊 Estadísticas:');
    console.log('  -', 'Total hojas:', result.stats.totalHojas);
    console.log('  -', 'Hoja de registros:', result.stats.hojasDetectadas.registros || 'No detectada');
    console.log('  -', 'Hoja de resumen:', result.stats.hojasDetectadas.resumen || 'No detectada');
    console.log('  -', 'Hojas de turnos:', result.stats.hojasDetectadas.turnos?.join(', ') || 'Ninguna');
    console.log('  -', 'Empleados detectados:', result.stats.totalEmpleados);
    console.log('  -', 'Marcas encontradas:', result.stats.totalMarcas);
    console.log('  -', 'Tiempo de procesamiento:', result.stats.tiempoProcesamiento + 'ms');
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Advertencias:');
      result.warnings.forEach(w => console.log('   -', w));
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errores:');
      result.errors.forEach(e => console.log('   -', e));
    }
    
    // Mostrar muestra de marcas
    if (result.marcas.length > 0) {
      console.log('\n📝 Primeras 10 marcas:');
      console.log('   Num   | Fecha        | Hora  | Tipo');
      console.log('   ------|--------------|-------|----------');
      
      result.marcas.slice(0, 10).forEach(marca => {
        const fecha = marca.fecha.toLocaleDateString();
        console.log(`   ${marca.num_empleado.padEnd(6)}| ${fecha.padEnd(13)}| ${marca.hora.padEnd(6)}| ${marca.tipo}`);
      });
      
      if (result.marcas.length > 10) {
        console.log(`   ... y ${result.marcas.length - 10} marcas más`);
      }
    }
    
    // Mostrar empleados detectados
    if (result.empleados.length > 0) {
      console.log('\n👥 Empleados detectados:');
      result.empleados.slice(0, 10).forEach(emp => {
        console.log(`   ${emp.num} - ${emp.nombre || 'Sin nombre'}`);
      });
      
      if (result.empleados.length > 10) {
        console.log(`   ... y ${result.empleados.length - 10} empleados más`);
      }
    }
    
    console.log('\n╚════════════════════════════════════════════════════════════╝');
    console.log('✅ Test completado exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar test
testParser();



