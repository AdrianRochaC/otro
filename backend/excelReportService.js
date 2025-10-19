const xl = require('excel4node');
const { getCargoMetrics } = require('./cargosMetrics.js');

class ExcelReportService {
  constructor() {
    this.workbook = new xl.Workbook();
  }

  // Crear reporte completo de cargos con gráficas
  async generateCargosReport(cargosData) {
    const workbook = new xl.Workbook();
    
    // Configurar propiedades del workbook
    workbook.creator = 'Sistema de Gestión Educativa';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Crear hoja principal de resumen
    const summarySheet = workbook.addWorksheet('Resumen Ejecutivo');

    // Crear hoja de datos detallados
    const dataSheet = workbook.addWorksheet('Datos Detallados');

    // Crear hoja de gráficas
    const chartsSheet = workbook.addWorksheet('Gráficas');

    // Crear hoja individual para cada cargo
    for (const cargo of cargosData) {
      const cargoSheet = workbook.addWorksheet(`Cargo_${cargo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}`);
      await this.createIndividualCargoSheet(cargoSheet, cargo);
    }

    // Generar contenido de las hojas
    await this.createSummarySheet(summarySheet, cargosData);
    await this.createDataSheet(dataSheet, cargosData);
    await this.createChartsSheet(chartsSheet, cargosData);

    return workbook;
  }

  // Crear hoja de resumen ejecutivo
  async createSummarySheet(sheet, cargosData) {
    // Título principal
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REPORTE EJECUTIVO - GESTIÓN DE CARGOS';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Información de fecha
    sheet.mergeCells('A2:H2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Generado el: ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    dateCell.font = { size: 12, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    // Espaciado
    sheet.getRow(3).height = 20;

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
        const cellRef = sheet.getCell(rowNum, colIndex + 1);
        cellRef.value = cell;
        
        if (index === 0) { // Encabezados
          cellRef.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
          cellRef.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIndex === 0) { // Primera columna (métricas)
          cellRef.font = { bold: true };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        } else if (colIndex === 1) { // Segunda columna (valores)
          cellRef.font = { bold: true, color: { argb: 'FF2F5597' } };
          cellRef.alignment = { horizontal: 'center' };
        }
      });
    });

    // Ajustar ancho de columnas
    sheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 40 }
    ];

    // Agregar bordes a la tabla
    const tableRange = `A4:C${3 + statsData.length}`;
    this.addBorders(sheet, tableRange);

    // Espaciado final
    sheet.getRow(4 + statsData.length + 2).height = 20;
  }

  // Crear hoja de datos detallados
  async createDataSheet(sheet, cargosData) {
    // Título
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'DATOS DETALLADOS DE CARGOS';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Encabezados de tabla
    const headers = [
      'ID', 'Nombre del Cargo', 'Descripción', 
      'Usuarios Asignados', 'Cursos Asignados', 'Documentos', 'Fecha de Creación'
    ];

    headers.forEach((header, index) => {
      const cell = sheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
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
        const cell = sheet.getCell(row, colIndex + 1);
        cell.value = data;
        
        if (colIndex >= 3 && colIndex <= 5) { // Columnas numéricas
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Ajustar ancho de columnas
    sheet.columns = [
      { width: 8 },
      { width: 25 },
      { width: 40 },
      { width: 18 },
      { width: 18 },
      { width: 15 },
      { width: 15 }
    ];

    // Agregar bordes
    const dataRange = `A3:G${3 + cargosData.length}`;
    this.addBorders(sheet, dataRange);

    // Agregar filtros
    sheet.autoFilter = `A3:G${3 + cargosData.length}`;
  }

  // Crear hoja de gráficas
  async createChartsSheet(sheet, cargosData) {
    try {
      console.log('🎯 INICIANDO CREACIÓN DE GRÁFICAS CON EXCEL4NODE...');
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
        sheet.cell(progresoTableStartRow, index + 1).string(header)
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

      // CREAR GRÁFICA DE TORTA DE PROGRESO
      console.log('🥧 Creando gráfica de torta con excel4node...');
      
      if (chartData.progresoData.length > 0) {
        try {
          console.log('✅ Hay datos de progreso, creando gráfica de torta...');
          
          // Crear gráfica de torta
          const chart = sheet.chart({
            type: 'pie',
            title: 'Progreso Promedio por Cargo',
            data: {
              categories: chartData.progresoData.map(item => item.cargo),
              values: chartData.progresoData.map(item => item.progreso)
            },
            position: {
              x: 4, // Columna D
              y: 2  // Fila 2
            },
            size: {
              width: 400,
              height: 300
            }
          });
          
          console.log('🎉 ¡GRÁFICA DE TORTA CREADA CON EXCEL4NODE!');
          
        } catch (chartError) {
          console.error('❌ ERROR creando gráfica:', chartError);
          console.error('❌ Stack trace:', chartError.stack);
          
          // Fallback: crear tabla con barras visuales
          console.log('🔄 Creando fallback con barras visuales...');
          
          const visualHeaders = ['Cargo', 'Progreso (%)', 'Barra Visual', 'Estado'];
          visualHeaders.forEach((header, index) => {
            sheet.cell(progresoTableStartRow, index + 1).string(header)
              .style({
                font: { bold: true },
                fill: { type: 'pattern', patternType: 'solid', fgColor: 'F2F2F2' }
              });
          });
          
          chartData.progresoData.forEach((item, index) => {
            const row = progresoTableStartRow + 1 + index;
            const progreso = item.progreso;
            const barLength = Math.round(progreso / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            
            let color = '000000';
            if (progreso >= 80) color = '00AA00';
            else if (progreso >= 60) color = '0088FF';
            else if (progreso >= 40) color = 'FF8800';
            else color = 'FF0000';
            
            let estado = progreso >= 80 ? 'Excelente' : progreso >= 60 ? 'Bueno' : progreso >= 40 ? 'Regular' : 'Necesita Mejora';
            
            sheet.cell(row, 1).string(item.cargo);
            sheet.cell(row, 2).number(progreso).style({ font: { bold: true, color: color } });
            sheet.cell(row, 3).string(bar).style({ font: { color: color } });
            sheet.cell(row, 4).string(estado).style({ font: { bold: true, color: color } });
          });
        }
      } else {
        console.log('⚠️ No hay datos de progreso');
      }

      // Agregar título de la visualización
      sheet.cell(progresoTableStartRow - 1, 1).string('📊 Progreso Promedio por Cargo')
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

  // Calcular estadísticas
  calculateStatistics(cargosData) {
    const totalCargos = cargosData.length;
    const totalUsuarios = cargosData.reduce((sum, c) => sum + (c.usuarios_count || 0), 0);
    const promedioUsuarios = totalCargos > 0 ? Math.round(totalUsuarios / totalCargos) : 0;
    
    const cargoMasActivo = cargosData.reduce((max, cargo) => 
      (cargo.usuarios_count || 0) > (max.usuarios_count || 0) ? cargo : max
    );

    return {
      totalCargos,
      totalUsuarios,
      promedioUsuarios,
      cargoMasActivo: cargoMasActivo.nombre || 'N/A'
    };
  }

  // Preparar datos para gráficas
  prepareChartData(cargosData) {
    // Datos para gráfica de torta de usuarios
    const pieChartData = cargosData
      .filter(cargo => (cargo.usuarios_count || 0) > 0) // Solo cargos con usuarios
      .sort((a, b) => (b.usuarios_count || 0) - (a.usuarios_count || 0))
      .map(cargo => ({
        cargo: cargo.nombre,
        usuarios: cargo.usuarios_count || 0
      }));

    // Datos para gráfica de torta de progreso
    const progresoData = cargosData
      .filter(cargo => (cargo.promedio_progreso || 0) > 0) // Solo cargos con progreso
      .sort((a, b) => (b.promedio_progreso || 0) - (a.promedio_progreso || 0))
      .map(cargo => ({
        cargo: cargo.nombre,
        progreso: Math.round(cargo.promedio_progreso || 0)
      }));

    // Datos para gráfica de torta de cursos
    const cursosData = cargosData
      .filter(cargo => (cargo.cursos_count || 0) > 0) // Solo cargos con cursos
      .sort((a, b) => (b.cursos_count || 0) - (a.cursos_count || 0))
      .map(cargo => ({
        cargo: cargo.nombre,
        cursos: cargo.cursos_count || 0
      }));

    // Datos para gráfica de torta de estado de usuarios
    const totalActivos = cargosData.reduce((sum, cargo) => sum + (cargo.usuarios_activos || 0), 0);
    const totalInactivos = cargosData.reduce((sum, cargo) => sum + (cargo.usuarios_count || 0) - (cargo.usuarios_activos || 0), 0);
    
    const estadoData = [];
    if (totalActivos > 0) {
      estadoData.push({ estado: 'Usuarios Activos', cantidad: totalActivos });
    }
    if (totalInactivos > 0) {
      estadoData.push({ estado: 'Usuarios Inactivos', cantidad: totalInactivos });
    }

    // Datos para gráfica de torta de documentos
    const documentosData = cargosData
      .filter(cargo => (cargo.documentos_count || 0) > 0) // Solo cargos con documentos
      .sort((a, b) => (b.documentos_count || 0) - (a.documentos_count || 0))
      .map(cargo => ({
        cargo: cargo.nombre,
        documentos: cargo.documentos_count || 0
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
  addBorders(sheet, range) {
    const [startCell, endCell] = range.split(':');
    const startCol = this.getColumnNumber(startCell.match(/[A-Z]+/)[0]);
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const endCol = this.getColumnNumber(endCell.match(/[A-Z]+/)[0]);
    const endRow = parseInt(endCell.match(/\d+/)[0]);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = sheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
  }

  // Convertir letra de columna a número
  getColumnNumber(column) {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  // Crear hoja individual para cada cargo
  async createIndividualCargoSheet(sheet, cargo) {
    // Título principal
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REPORTE INDIVIDUAL - ${cargo.nombre.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Información básica del cargo
    const infoData = [
      ['INFORMACIÓN DEL CARGO', ''],
      ['ID:', cargo.id],
      ['Nombre:', cargo.nombre],
      ['Descripción:', cargo.descripcion],
      ['Fecha de Creación:', new Date(cargo.created_at).toLocaleDateString('es-ES')],
      ['', ''],
      ['ESTADÍSTICAS', ''],
      ['Total de Usuarios:', cargo.usuarios_count || 0],
      ['Total de Cursos:', cargo.cursos_count || 0],
      ['Total de Documentos:', cargo.documentos_count || 0],
      ['Promedio de Progreso:', `${cargo.promedio_progreso || 0}%`]
    ];

    infoData.forEach((row, index) => {
      const rowNum = 3 + index;
      row.forEach((cell, colIndex) => {
        const cellRef = sheet.getCell(rowNum, colIndex + 1);
        cellRef.value = cell;
        
        if (index === 0 || index === 7) { // Títulos de sección
          cellRef.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } };
        } else if (colIndex === 0) { // Primera columna (etiquetas)
          cellRef.font = { bold: true };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        } else if (colIndex === 1 && index > 0 && index !== 7) { // Segunda columna (valores)
          cellRef.font = { bold: true, color: { argb: 'FF9B59B6' } };
          if (index >= 8 && index <= 11) { // Valores numéricos
            cellRef.alignment = { horizontal: 'center' };
          }
        }
      });
    });

    // Ajustar ancho de columnas
    sheet.columns = [
      { width: 25 },
      { width: 30 }
    ];

    // Agregar bordes a la información
    this.addBorders(sheet, `A3:B${3 + infoData.length - 1}`);

    // Espaciado
    sheet.getRow(3 + infoData.length + 1).height = 20;

    // Agregar análisis adicional si hay datos
    if (cargo.usuarios_count > 0) {
      const analysisStartRow = 3 + infoData.length + 2;
      
      // Título de análisis
      sheet.mergeCells(`A${analysisStartRow}:F${analysisStartRow}`);
      const analysisTitle = sheet.getCell(`A${analysisStartRow}`);
      analysisTitle.value = 'ANÁLISIS DETALLADO';
      analysisTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      analysisTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } };
      analysisTitle.alignment = { horizontal: 'center', vertical: 'middle' };

      // Análisis de rendimiento
      const analysisData = [
        ['MÉTRICA', 'VALOR', 'DESCRIPCIÓN'],
        ['Usuarios Activos', cargo.usuarios_activos || 0, 'Usuarios con estado activo'],
        ['Usuarios Inactivos', (cargo.usuarios_count || 0) - (cargo.usuarios_activos || 0), 'Usuarios con estado inactivo'],
        ['Cursos Aprobados', cargo.cursos_aprobados || 0, 'Total de cursos aprobados por usuarios'],
        ['Tasa de Aprobación', `${cargo.tasa_aprobacion || 0}%`, 'Porcentaje de cursos aprobados'],
        ['Intentos Promedio', `${cargo.intentos_promedio || 0}`, 'Intentos promedio por curso']
      ];

      analysisData.forEach((row, index) => {
        const rowNum = analysisStartRow + 2 + index;
        row.forEach((cell, colIndex) => {
          const cellRef = sheet.getCell(rowNum, colIndex + 1);
          cellRef.value = cell;
          
          if (index === 0) { // Encabezados
            cellRef.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } };
            cellRef.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colIndex === 0) { // Primera columna (métricas)
            cellRef.font = { bold: true };
            cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
          } else if (colIndex === 1) { // Segunda columna (valores)
            cellRef.font = { bold: true, color: { argb: 'FF9B59B6' } };
            cellRef.alignment = { horizontal: 'center' };
          }
        });
      });

      // Ajustar ancho de columnas para análisis
      sheet.columns = [
        { width: 25 },
        { width: 30 },
        { width: 20 },
        { width: 15 },
        { width: 20 },
        { width: 25 }
      ];

      // Agregar bordes al análisis
      this.addBorders(sheet, `A${analysisStartRow + 2}:C${analysisStartRow + 2 + analysisData.length - 1}`);
    }
  }

  // Generar reporte individual de un cargo
  async generateIndividualCargoReport(cargo) {
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del workbook
    workbook.creator = 'Sistema de Gestión Educativa';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Crear hoja principal del cargo
    const cargoSheet = workbook.addWorksheet(`Reporte_${cargo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}`, {
      properties: { tabColor: { argb: 'FF9B59B6' } }
    });

    // Crear hoja de análisis detallado
    const analysisSheet = workbook.addWorksheet('Análisis Detallado', {
      properties: { tabColor: { argb: 'FFE67E22' } }
    });

    // Generar contenido de las hojas
    await this.createIndividualCargoSheet(cargoSheet, cargo);
    await this.createDetailedAnalysisSheet(analysisSheet, cargo);

    return workbook;
  }

  // Crear hoja de análisis detallado
  async createDetailedAnalysisSheet(sheet, cargo) {
    // Título
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `ANÁLISIS DETALLADO - ${cargo.nombre.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Información de fecha
    sheet.mergeCells('A2:F2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Generado el: ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    dateCell.font = { size: 12, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    // Espaciado
    sheet.getRow(3).height = 20;

    // Análisis de rendimiento
    const performanceData = [
      ['ANÁLISIS DE RENDIMIENTO', ''],
      ['Métrica', 'Valor', 'Descripción'],
      ['Total de Usuarios', cargo.usuarios_count || 0, 'Número total de usuarios asignados'],
      ['Usuarios Activos', cargo.usuarios_activos || 0, 'Usuarios con estado activo'],
      ['Usuarios Inactivos', cargo.usuarios_inactivos || 0, 'Usuarios con estado inactivo'],
      ['Total de Cursos', cargo.cursos_count || 0, 'Cursos asignados al cargo'],
      ['Cursos Aprobados', cargo.cursos_aprobados || 0, 'Total de cursos aprobados'],
      ['Tasa de Aprobación', `${cargo.tasa_aprobacion || 0}%`, 'Porcentaje de cursos aprobados'],
      ['Promedio de Progreso', `${cargo.promedio_progreso || 0}%`, 'Progreso promedio de usuarios'],
      ['Intentos Promedio', `${cargo.intentos_promedio || 0}`, 'Intentos promedio por curso'],
      ['Total de Documentos', cargo.documentos_count || 0, 'Documentos asignados al cargo']
    ];

    performanceData.forEach((row, index) => {
      const rowNum = 4 + index;
      row.forEach((cell, colIndex) => {
        const cellRef = sheet.getCell(rowNum, colIndex + 1);
        cellRef.value = cell;
        
        if (index === 0) { // Título de sección
          cellRef.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
        } else if (index === 1) { // Encabezados
          cellRef.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
          cellRef.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIndex === 0) { // Primera columna (métricas)
          cellRef.font = { bold: true };
          cellRef.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        } else if (colIndex === 1) { // Segunda columna (valores)
          cellRef.font = { bold: true, color: { argb: 'FFE67E22' } };
          cellRef.alignment = { horizontal: 'center' };
        }
      });
    });

    // Ajustar ancho de columnas
    sheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 40 }
    ];

    // Agregar bordes
    this.addBorders(sheet, `A4:C${4 + performanceData.length - 1}`);

    // Espaciado
    sheet.getRow(4 + performanceData.length + 1).height = 20;

    // Recomendaciones
    const recommendationsStartRow = 4 + performanceData.length + 2;
    
    sheet.mergeCells(`A${recommendationsStartRow}:F${recommendationsStartRow}`);
    const recTitle = sheet.getCell(`A${recommendationsStartRow}`);
    recTitle.value = 'RECOMENDACIONES';
    recTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    recTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
    recTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    const recommendations = this.generateRecommendations(cargo);
    recommendations.forEach((rec, index) => {
      const rowNum = recommendationsStartRow + 2 + index;
      sheet.getCell(rowNum, 1).value = `${index + 1}. ${rec}`;
      sheet.getCell(rowNum, 1).font = { size: 11 };
      sheet.getCell(rowNum, 1).alignment = { wrapText: true };
    });

    // Ajustar ancho de columna para recomendaciones
    sheet.getColumn(1).width = 80;
  }

  // Generar recomendaciones basadas en los datos del cargo
  generateRecommendations(cargo) {
    const recommendations = [];

    if (cargo.usuarios_count === 0) {
      recommendations.push('Asignar usuarios a este cargo para comenzar a generar actividad');
    }

    if (cargo.cursos_count === 0) {
      recommendations.push('Crear cursos específicos para este cargo');
    }

    if (cargo.tasa_aprobacion < 70 && cargo.cursos_count > 0) {
      recommendations.push('Revisar la dificultad de los cursos o proporcionar más capacitación');
    }

    if (cargo.usuarios_inactivos > cargo.usuarios_activos) {
      recommendations.push('Revisar el estado de los usuarios inactivos y reactivarlos si es necesario');
    }

    if (cargo.promedio_progreso < 50) {
      recommendations.push('Implementar estrategias de motivación para mejorar el progreso de los usuarios');
    }

    if (cargo.documentos_count === 0) {
      recommendations.push('Agregar documentos de referencia para este cargo');
    }

    if (recommendations.length === 0) {
      recommendations.push('El cargo está funcionando correctamente. Mantener el seguimiento regular');
    }

    return recommendations;
  }

  // Generar archivo Excel y devolver buffer
  async generateExcelBuffer(workbook) {
    return await workbook.writeToBuffer();
  }
}

module.exports = new ExcelReportService();

