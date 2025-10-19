console.log('📦 Cargando excel4node...');
const xl = require('excel4node');
console.log('✅ excel4node cargado correctamente');
const path = require('path');
const fs = require('fs');
const { getCargoMetrics } = require('./cargosMetrics.js');

class ExcelReportServiceNew {
  constructor() {
    this.workbook = new xl.Workbook();
  }

  // Crear reporte completo de cargos con gráficas
  async generateCargosReport(cargosData) {
    try {
      console.log('🎯 INICIANDO GENERACIÓN CON EXCEL4NODE...');
      console.log('📊 Datos recibidos:', cargosData?.length || 0, 'cargos');
      
      const workbook = new xl.Workbook();
      
      // Configurar propiedades del workbook
      workbook.creator = 'Sistema de Gestión Educativa';
      workbook.lastModifiedBy = 'Sistema';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      console.log('✅ Workbook creado exitosamente');

      // Crear hoja principal de resumen
      const summarySheet = workbook.addWorksheet('Resumen Ejecutivo', {
        tabColor: '4472C4'
      });

      // Crear hoja de datos detallados
      const dataSheet = workbook.addWorksheet('Datos Detallados', {
        tabColor: '70AD47'
      });

      // Crear hoja de gráficas
      const chartsSheet = workbook.addWorksheet('Gráficas', {
        tabColor: 'E74C3C'
      });

      // Crear hoja individual para cada cargo
      for (const cargo of cargosData) {
        const cargoSheet = workbook.addWorksheet(`Cargo_${cargo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}`, {
          tabColor: '9B59B6'
        });
        await this.createIndividualCargoSheet(cargoSheet, cargo);
      }

      // Generar contenido de las hojas
      console.log('📋 Creando hoja de resumen...');
      await this.createSummarySheet(summarySheet, cargosData);
      console.log('✅ Hoja de resumen creada');
      
      console.log('📋 Creando hoja de datos...');
      await this.createDataSheet(dataSheet, cargosData);
      console.log('✅ Hoja de datos creada');
      
      console.log('📋 Creando hoja de gráficas...');
      await this.createChartsSheet(chartsSheet, cargosData);
      console.log('✅ Hoja de gráficas creada');

      console.log('🎉 Reporte generado exitosamente con excel4node');
      return workbook;
    } catch (error) {
      console.error('❌ ERROR EN GENERACIÓN CON EXCEL4NODE:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Crear hoja de resumen ejecutivo
  async createSummarySheet(sheet, cargosData) {
    // Agregar logo de la empresa
    try {
      const logoPath = path.join(__dirname, '..', 'public', 'image.jpg');
      console.log('🖼️ Buscando logo en:', logoPath);
      
      if (fs.existsSync(logoPath)) {
        console.log('✅ Logo encontrado, agregando...');
        
        // Agregar imagen en la esquina superior izquierda
        sheet.addImage({
          path: logoPath,
          type: 'picture',
          position: {
            type: 'absolute',
            x: 10,
            y: 10
          },
          width: 150,
          height: 100
        });
        
        console.log('🎉 Logo agregado exitosamente');
      } else {
        console.log('⚠️ Logo no encontrado en:', logoPath);
      }
    } catch (error) {
      console.log('❌ Error agregando logo:', error.message);
    }
    
    // Título principal
    sheet.cell(1, 1, 1, 8, true).string('REPORTE EJECUTIVO - GESTIÓN DE CARGOS')
      .style({
        font: { size: 18, bold: true, color: 'FFFFFF' },
        fill: { type: 'pattern', patternType: 'solid', fgColor: '2F5597' },
        alignment: { horizontal: 'center', vertical: 'center' }
      });

    // Información de fecha
    sheet.cell(2, 1, 2, 8, true).string(`Generado el: ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`)
      .style({
        font: { size: 12, italic: true },
        alignment: { horizontal: 'center' }
      });

    // Espaciado
    sheet.row(3).setHeight(20);

    // Resumen estadístico
    const stats = this.calculateStatistics(cargosData);
    
    // Crear tabla de estadísticas
    const statsData = [
      ['MÉTRICA', 'VALOR', 'DESCRIPCIÓN'],
      ['Total de Cargos', stats.totalCargos, 'Número total de cargos registrados'],
      ['Promedio de Usuarios', stats.promedioUsuarios, 'Usuarios promedio por cargo'],
      ['Total de Usuarios', stats.totalUsuarios, 'Usuarios únicos en todos los cargos'],
      ['Cargos con Mayor Actividad', stats.cargoMasActivo, 'Cargo con más usuarios asignados']
    ];

    // Aplicar datos a la hoja
    statsData.forEach((row, index) => {
      const rowNum = 4 + index;
      row.forEach((cell, colIndex) => {
        const cellRef = sheet.cell(rowNum, colIndex + 1);
        
        if (typeof cell === 'number') {
          cellRef.number(cell);
        } else {
          cellRef.string(cell);
        }
        
        if (index === 0) { // Encabezados
          cellRef.style({
            font: { bold: true, color: 'FFFFFF' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: '4472C4' },
            alignment: { horizontal: 'center', vertical: 'center' }
          });
        } else if (colIndex === 0) { // Primera columna (métricas)
          cellRef.style({
            font: { bold: true },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'F2F2F2' }
          });
        } else if (colIndex === 1) { // Segunda columna (valores)
          cellRef.style({
            font: { bold: true, color: '2F5597' },
            alignment: { horizontal: 'center' }
          });
        }
      });
    });

    // Ajustar ancho de columnas
    sheet.column(1).setWidth(25);
    sheet.column(2).setWidth(15);
    sheet.column(3).setWidth(40);

    // Agregar bordes a la tabla
    this.addBorders(sheet, 4, 1, 3 + statsData.length, 3);

    // Espaciado final
    sheet.row(4 + statsData.length + 2).setHeight(20);
  }

  // Crear hoja de datos detallados
  async createDataSheet(sheet, cargosData) {
    // Título
    sheet.cell(1, 1, 1, 8, true).string('DATOS DETALLADOS DE CARGOS')
      .style({
        font: { size: 16, bold: true, color: 'FFFFFF' },
        fill: { type: 'pattern', patternType: 'solid', fgColor: '70AD47' },
        alignment: { horizontal: 'center', vertical: 'center' }
      });

    // Encabezados de tabla
    const headers = [
      'ID', 'Nombre del Cargo', 'Descripción', 
      'Usuarios Asignados', 'Cursos Asignados', 'Documentos', 'Fecha de Creación'
    ];

    headers.forEach((header, index) => {
      const cell = sheet.cell(3, index + 1);
      cell.string(header)
        .style({
          font: { bold: true, color: 'FFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: '70AD47' },
          alignment: { horizontal: 'center', vertical: 'center' }
        });
    });

    // Datos de cargos
    cargosData.forEach((cargo, index) => {
      const row = 4 + index;
      const rowData = [
        cargo.id,
        cargo.nombre,
        cargo.descripcion,
        cargo.usuarios_count || 0,
        cargo.cursos_count || 0,
        cargo.documentos_count || 0,
        new Date(cargo.created_at).toLocaleDateString('es-ES')
      ];

      rowData.forEach((data, colIndex) => {
        const cell = sheet.cell(row, colIndex + 1);
        
        if (typeof data === 'number') {
          cell.number(data);
        } else {
          cell.string(data);
        }
        
        if (colIndex >= 3 && colIndex <= 5) { // Columnas numéricas
          cell.style({ alignment: { horizontal: 'center' } });
        }
      });
    });

    // Ajustar ancho de columnas
    sheet.column(1).setWidth(8);
    sheet.column(2).setWidth(25);
    sheet.column(3).setWidth(40);
    sheet.column(4).setWidth(18);
    sheet.column(5).setWidth(18);
    sheet.column(6).setWidth(15);
    sheet.column(7).setWidth(15);

    // Agregar bordes
    this.addBorders(sheet, 3, 1, 3 + cargosData.length, 7);

    // Agregar filtros
    sheet.addFilter(3, 1, 3 + cargosData.length, 7);
  }

  // Crear hoja de gráficas
  async createChartsSheet(sheet, cargosData) {
    try {
      console.log('🎯 INICIANDO CREACIÓN DE BARRAS VISUALES...');
      console.log('📊 Datos recibidos:', cargosData?.length || 0, 'cargos');
      
      // Título
      sheet.cell(1, 1, 1, 8, true).string('ANÁLISIS GRÁFICO DE CARGOS')
        .style({
          font: { size: 16, bold: true, color: 'FFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'E74C3C' },
          alignment: { horizontal: 'center', vertical: 'center' }
        });

      // Verificar que hay datos
      if (!cargosData || cargosData.length === 0) {
        console.log('❌ No hay datos de cargos');
        sheet.cell(3, 1).string('No hay datos disponibles para generar gráficas')
          .style({ font: { size: 14, italic: true } });
        return;
      }

      // Preparar datos para gráficas
      console.log('📈 Preparando datos para gráficas...');
      const chartData = this.prepareChartData(cargosData);
      console.log('📊 Datos preparados:', chartData);

      // Crear tabla de datos para gráfica de torta de progreso
      const progresoTableStartRow = 3;
      const progresoHeaders = ['Cargo', 'Progreso Promedio (%)'];
      
      console.log('📋 Creando tabla de progreso...');
      progresoHeaders.forEach((header, index) => {
        const cell = sheet.cell(progresoTableStartRow, index + 1);
        cell.string(header)
          .style({
            font: { bold: true },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'F2F2F2' }
          });
      });

      console.log('📊 Datos de progreso:', chartData.progresoData);
      chartData.progresoData.forEach((item, index) => {
        const row = progresoTableStartRow + 1 + index;
        sheet.cell(row, 1).string(item.cargo);
        sheet.cell(row, 2).number(item.progreso);
        console.log(`📝 Fila ${row}: ${item.cargo} - ${item.progreso}%`);
      });

      // CREAR BARRAS VISUALES
      console.log('📊 Creando barras visuales...');
      
      if (chartData.progresoData.length > 0) {
        console.log('✅ Hay datos de progreso, creando barras visuales...');
        
        // Agregar columnas adicionales para barras visuales
        const visualHeaders = ['Cargo', 'Progreso (%)', 'Barra Visual', 'Estado'];
        
        // Recrear encabezados con más columnas
        visualHeaders.forEach((header, index) => {
          const cell = sheet.cell(progresoTableStartRow, index + 1);
          cell.string(header)
            .style({
              font: { bold: true },
              fill: { type: 'pattern', patternType: 'solid', fgColor: 'F2F2F2' }
            });
        });
        
        // Crear barras visuales para cada cargo
        chartData.progresoData.forEach((item, index) => {
          const row = progresoTableStartRow + 1 + index;
          const progreso = item.progreso;
          
          // Crear barra visual con caracteres
          const barLength = Math.round(progreso / 5); // Cada 5% = 1 carácter
          const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
          
          // Determinar color según progreso
          let color = '000000'; // Negro por defecto
          if (progreso >= 80) color = '00AA00'; // Verde
          else if (progreso >= 60) color = '0088FF'; // Azul
          else if (progreso >= 40) color = 'FF8800'; // Naranja
          else color = 'FF0000'; // Rojo
          
          // Determinar estado
          let estado = 'Excelente';
          if (progreso < 80) estado = 'Bueno';
          if (progreso < 60) estado = 'Regular';
          if (progreso < 40) estado = 'Necesita Mejora';
          
          // Llenar datos
          sheet.cell(row, 1).string(item.cargo);
          sheet.cell(row, 2).number(progreso);
          sheet.cell(row, 3).string(bar);
          sheet.cell(row, 4).string(estado);
          
          // Aplicar colores
          sheet.cell(row, 2).style({ font: { bold: true, color: color } });
          sheet.cell(row, 3).style({ font: { color: color } });
          sheet.cell(row, 4).style({ font: { bold: true, color: color } });
          
          console.log(`📊 ${item.cargo}: ${progreso}% - ${estado}`);
        });
        
        // Ajustar ancho de columnas
        sheet.column(1).setWidth(25); // Cargo
        sheet.column(2).setWidth(12); // Progreso
        sheet.column(3).setWidth(25); // Barra visual
        sheet.column(4).setWidth(18); // Estado
        
        console.log('🎉 ¡BARRAS VISUALES CREADAS EXITOSAMENTE!');
        
      } else {
        console.log('⚠️ No hay datos de progreso');
      }

      // Agregar bordes a la tabla
      this.addBorders(sheet, progresoTableStartRow, 1, progresoTableStartRow + chartData.progresoData.length, 4);

      // Agregar título de la visualización
      sheet.cell(progresoTableStartRow - 1, 1).string('📊 Progreso Promedio por Cargo (Barras Visuales)')
        .style({ font: { bold: true, size: 14 } });
      
      console.log('✅ Hoja de gráficas completada exitosamente');

    } catch (error) {
      console.error('❌ ERROR GENERAL en createChartsSheet:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error name:', error.name);
      
      // Si hay error, crear una hoja simple con solo tablas
      sheet.cell(3, 1).string(`Error generando gráficas: ${error.message}`)
        .style({ font: { size: 12, italic: true, color: 'FF0000' } });
    }
  }

  // Crear hoja individual de cargo
  async createIndividualCargoSheet(sheet, cargo) {
    // Título del cargo
    sheet.cell(1, 1, 1, 6, true).string(`DETALLES DEL CARGO: ${cargo.nombre.toUpperCase()}`)
      .style({
        font: { size: 16, bold: true, color: 'FFFFFF' },
        fill: { type: 'pattern', patternType: 'solid', fgColor: '9B59B6' },
        alignment: { horizontal: 'center', vertical: 'center' }
      });

    // Información básica
    const infoData = [
      ['ID del Cargo:', cargo.id],
      ['Nombre:', cargo.nombre],
      ['Descripción:', cargo.descripcion],
      ['Fecha de Creación:', new Date(cargo.created_at).toLocaleDateString('es-ES')],
      ['Usuarios Asignados:', cargo.usuarios_count || 0],
      ['Cursos Asignados:', cargo.cursos_count || 0],
      ['Documentos:', cargo.documentos_count || 0]
    ];

    infoData.forEach((row, index) => {
      const rowNum = 3 + index;
      sheet.cell(rowNum, 1).string(row[0])
        .style({ font: { bold: true } });
      sheet.cell(rowNum, 2).string(row[1].toString());
    });

    // Ajustar ancho de columnas
    sheet.column(1).setWidth(20);
    sheet.column(2).setWidth(30);
  }

  // Calcular estadísticas
  calculateStatistics(cargosData) {
    const totalCargos = cargosData.length;
    const totalUsuarios = cargosData.reduce((sum, cargo) => sum + (cargo.usuarios_count || 0), 0);
    const promedioUsuarios = totalCargos > 0 ? Math.round(totalUsuarios / totalCargos * 100) / 100 : 0;
    
    const cargoMasActivo = cargosData.reduce((max, cargo) => 
      (cargo.usuarios_count || 0) > (max.usuarios_count || 0) ? cargo : max, cargosData[0]);

    return {
      totalCargos,
      promedioUsuarios,
      totalUsuarios,
      cargoMasActivo: cargoMasActivo ? cargoMasActivo.nombre : 'N/A'
    };
  }

  // Preparar datos para gráficas
  prepareChartData(cargosData) {
    const pieChartData = cargosData.map(cargo => ({
      cargo: cargo.nombre,
      usuarios: cargo.usuarios_count || 0
    }));

    const progresoData = cargosData
      .filter(cargo => cargo.promedio_progreso !== null && cargo.promedio_progreso > 0)
      .map(cargo => ({
        cargo: cargo.nombre,
        progreso: Math.round(cargo.promedio_progreso)
      }));

    const cursosData = cargosData
      .filter(cargo => cargo.cursos_count > 0)
      .map(cargo => ({
        cargo: cargo.nombre,
        cursos: cargo.cursos_count
      }));

    const estadoData = [
      { estado: 'Usuarios Activos', cantidad: cargosData.reduce((sum, cargo) => sum + (cargo.usuarios_activos || 0), 0) },
      { estado: 'Usuarios Inactivos', cantidad: cargosData.reduce((sum, cargo) => sum + (cargo.usuarios_inactivos || 0), 0) }
    ];

    const documentosData = cargosData
      .filter(cargo => cargo.documentos_count > 0)
      .map(cargo => ({
        cargo: cargo.nombre,
        documentos: cargo.documentos_count
      }));

    return {
      pieChartData,
      progresoData,
      cursosData,
      estadoData,
      documentosData
    };
  }

  // Agregar bordes a un rango
  addBorders(sheet, startRow, startCol, endRow, endCol) {
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        sheet.cell(row, col).style({
          border: {
            left: { style: 'thin', color: '000000' },
            right: { style: 'thin', color: '000000' },
            top: { style: 'thin', color: '000000' },
            bottom: { style: 'thin', color: '000000' }
          }
        });
      }
    }
  }

  // Generar buffer del Excel
  async generateExcelBuffer(workbook) {
    try {
      console.log('📊 Generando buffer con excel4node...');
      const buffer = await workbook.writeToBuffer();
      console.log('✅ Buffer generado exitosamente, tamaño:', buffer.length, 'bytes');
      return buffer;
    } catch (error) {
      console.error('❌ Error generando buffer:', error.message);
      throw error;
    }
  }
}

module.exports = new ExcelReportServiceNew();
