import PDFDocument from 'pdfkit';
import {
  CtJobsRepository,
  CtUnitsRepository,
  CtReelsRepository,
  CtJobOperationsRepository,
  CtJobFluidsRepository,
  CtJobBhaRepository,
} from './coiled-tubing.repository';
import type { CtJob } from '../../common/database/schema';

/**
 * Servicio para generación de Job Tickets en PDF
 * 
 * Genera documentos PDF profesionales con:
 * - Información del job (well, dates, status)
 * - Detalles de equipos (unit, reel)
 * - Configuración BHA
 * - Fluidos utilizados
 * - Operaciones realizadas
 * - Firmas digitales
 * - Branding corporativo
 */
export class JobTicketGeneratorService {
  private jobsRepo: CtJobsRepository;
  private unitsRepo: CtUnitsRepository;
  private reelsRepo: CtReelsRepository;
  private operationsRepo: CtJobOperationsRepository;
  private fluidsRepo: CtJobFluidsRepository;
  private bhaRepo: CtJobBhaRepository;

  constructor() {
    this.jobsRepo = new CtJobsRepository();
    this.unitsRepo = new CtUnitsRepository();
    this.reelsRepo = new CtReelsRepository();
    this.operationsRepo = new CtJobOperationsRepository();
    this.fluidsRepo = new CtJobFluidsRepository();
    this.bhaRepo = new CtJobBhaRepository();
  }

  /**
   * Genera un job ticket en PDF
   */
  async generateJobTicket(
    jobId: string,
    tenantId: string,
    options?: {
      includeSignatures?: boolean;
      includeBranding?: boolean;
      watermark?: string;
    }
  ): Promise<Buffer> {
    const job = await this.jobsRepo.findById(jobId, tenantId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    const [unit, reel, operations, fluids, bha] = await Promise.all([
      job.ctUnitId ? this.unitsRepo.findById(job.ctUnitId, tenantId) : null,
      job.ctReelId ? this.reelsRepo.findById(job.ctReelId, tenantId) : null,
      this.operationsRepo.findByJobId(jobId),
      this.fluidsRepo.findByJobId(jobId),
      this.bhaRepo.findByJobId(jobId),
    ]);

    return this.createPDF(job, {
      unit,
      reel,
      operations,
      fluids,
      bha,
      options: options || {},
    });
  }

  /**
   * Crea el documento PDF
   */
  private async createPDF(
    job: CtJob,
    data: {
      unit: any;
      reel: any;
      operations: any[];
      fluids: any[];
      bha: any;
      options: any;
    }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Coiled Tubing Job Ticket - ${job.jobNumber}`,
            Author: 'PetroEdge SCADA+ERP',
            Subject: 'Coiled Tubing Job Ticket',
            Keywords: 'coiled tubing, job ticket, petroleum',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        if (data.options.includeBranding !== false) {
          this.addHeader(doc, job);
        }

        if (data.options.watermark) {
          this.addWatermark(doc, data.options.watermark);
        }

        this.addJobInformation(doc, job);
        this.addEquipmentDetails(doc, data.unit, data.reel);
        
        if (data.bha) {
          this.addBhaConfiguration(doc, data.bha);
        }

        if (data.fluids && data.fluids.length > 0) {
          this.addFluidsSection(doc, data.fluids);
        }

        if (data.operations && data.operations.length > 0) {
          this.addOperationsLog(doc, data.operations);
        }

        if (data.options.includeSignatures !== false) {
          this.addSignatureSection(doc);
        }

        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Agrega el encabezado con branding
   */
  private addHeader(doc: PDFKit.PDFDocument, job: CtJob): void {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('COILED TUBING JOB TICKET', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('PetroEdge SCADA+ERP Platform', { align: 'center' })
      .moveDown(1);

    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Job #${job.jobNumber}`, { align: 'center' })
      .moveDown(0.5);

    const statusColor = this.getStatusColor(job.status);
    doc
      .fontSize(10)
      .fillColor(statusColor)
      .text(`Status: ${job.status}`, { align: 'center' })
      .fillColor('black')
      .moveDown(1.5);
  }

  /**
   * Agrega información del job
   */
  private addJobInformation(doc: PDFKit.PDFDocument, job: CtJob): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('JOB INFORMATION')
      .moveDown(0.5);

    const leftColumn = 50;
    const rightColumn = 300;
    let y = doc.y;

    doc.fontSize(10).font('Helvetica');

    this.addField(doc, leftColumn, y, 'Job Number:', job.jobNumber);
    this.addField(doc, rightColumn, y, 'Job Type:', job.jobType);
    y += 20;

    this.addField(doc, leftColumn, y, 'Well ID:', job.wellId || 'N/A');
    this.addField(doc, rightColumn, y, 'Status:', job.status);
    y += 20;

    if (job.plannedStartDate) {
      this.addField(
        doc,
        leftColumn,
        y,
        'Planned Start:',
        this.formatDate(job.plannedStartDate)
      );
    }
    if (job.plannedEndDate) {
      this.addField(
        doc,
        rightColumn,
        y,
        'Planned End:',
        this.formatDate(job.plannedEndDate)
      );
    }
    y += 20;

    if (job.actualStartDate) {
      this.addField(
        doc,
        leftColumn,
        y,
        'Actual Start:',
        this.formatDate(job.actualStartDate)
      );
    }
    if (job.actualEndDate) {
      this.addField(
        doc,
        rightColumn,
        y,
        'Actual End:',
        this.formatDate(job.actualEndDate)
      );
    }
    y += 20;

    if (job.tagDepthFt) {
      this.addField(doc, leftColumn, y, 'Target Depth:', `${job.tagDepthFt} ft`);
    }
    if (job.maxDepthReachedFt) {
      this.addField(doc, rightColumn, y, 'Max Depth Reached:', `${job.maxDepthReachedFt} ft`);
    }
    y += 20;

    if (job.objectives) {
      doc.y = y;
      doc.font('Helvetica-Bold').text('Objectives:', leftColumn);
      doc.font('Helvetica').text(job.objectives, leftColumn, doc.y, {
        width: 500,
        align: 'justify',
      });
      y = doc.y + 10;
    }

    doc.y = y + 10;
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1);
  }

  /**
   * Agrega detalles de equipos
   */
  private addEquipmentDetails(
    doc: PDFKit.PDFDocument,
    unit: any,
    reel: any
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('EQUIPMENT DETAILS')
      .moveDown(0.5);

    const leftColumn = 50;
    const rightColumn = 300;
    let y = doc.y;

    doc.fontSize(10).font('Helvetica');

    if (unit) {
      doc.font('Helvetica-Bold').text('CT Unit:', leftColumn, y);
      y += 15;
      this.addField(doc, leftColumn, y, 'Unit Number:', unit.unitNumber);
      this.addField(doc, rightColumn, y, 'Manufacturer:', unit.manufacturer || 'N/A');
      y += 20;
      this.addField(doc, leftColumn, y, 'Model:', unit.model || 'N/A');
      this.addField(doc, rightColumn, y, 'Status:', unit.status);
      y += 25;
    }

    if (reel) {
      doc.y = y;
      doc.font('Helvetica-Bold').text('CT Reel:', leftColumn);
      y = doc.y + 15;
      this.addField(doc, leftColumn, y, 'Reel Number:', reel.reelNumber);
      this.addField(doc, rightColumn, y, 'Manufacturer:', reel.manufacturer || 'N/A');
      y += 20;
      this.addField(
        doc,
        leftColumn,
        y,
        'OD x ID:',
        `${reel.outerDiameterIn}" x ${reel.innerDiameterIn}"`
      );
      this.addField(
        doc,
        rightColumn,
        y,
        'Usable Length:',
        `${reel.usableLengthFt} ft`
      );
      y += 20;
      this.addField(
        doc,
        leftColumn,
        y,
        'Yield Strength:',
        `${reel.yieldStrengthPsi} psi`
      );
      this.addField(
        doc,
        rightColumn,
        y,
        'Fatigue:',
        `${parseFloat(reel.fatiguePercentage || '0').toFixed(1)}%`
      );
      y += 20;
    }

    doc.y = y + 10;
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1);
  }

  /**
   * Agrega configuración BHA
   */
  private addBhaConfiguration(doc: PDFKit.PDFDocument, bha: any): void {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BHA CONFIGURATION')
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    const leftColumn = 50;
    const rightColumn = 300;
    let y = doc.y;

    if (bha.totalLengthFt) {
      this.addField(doc, leftColumn, y, 'Total Length:', `${bha.totalLengthFt} ft`);
    }
    if (bha.totalWeightLbs) {
      this.addField(doc, rightColumn, y, 'Total Weight:', `${bha.totalWeightLbs} lbs`);
    }
    y += 20;

    if (bha.configuration) {
      doc.y = y;
      doc.font('Helvetica-Bold').text('Components:', leftColumn);
      doc.font('Helvetica').text(bha.configuration, leftColumn, doc.y, {
        width: 500,
        align: 'left',
      });
      y = doc.y + 10;
    }

    doc.y = y + 10;
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1);
  }

  /**
   * Agrega sección de fluidos
   */
  private addFluidsSection(doc: PDFKit.PDFDocument, fluids: any[]): void {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('FLUIDS USED')
      .moveDown(0.5);

    doc.fontSize(9).font('Helvetica');

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 200;
    const col3 = 350;
    const col4 = 480;

    doc.font('Helvetica-Bold');
    doc.text('Fluid Type', col1, tableTop);
    doc.text('Volume (bbl)', col2, tableTop);
    doc.text('Density (ppg)', col3, tableTop);
    doc.text('Viscosity (cP)', col4, tableTop);

    let y = tableTop + 20;
    doc.font('Helvetica');

    fluids.forEach((fluid) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(fluid.fluidType || 'N/A', col1, y);
      doc.text(fluid.volumeBbl?.toString() || 'N/A', col2, y);
      doc.text(fluid.densityPpg?.toString() || 'N/A', col3, y);
      doc.text(fluid.viscosityCp?.toString() || 'N/A', col4, y);
      y += 20;
    });

    doc.y = y + 10;
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1);
  }

  /**
   * Agrega log de operaciones
   */
  private addOperationsLog(doc: PDFKit.PDFDocument, operations: any[]): void {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('OPERATIONS LOG')
      .moveDown(0.5);

    doc.fontSize(9).font('Helvetica');

    operations.forEach((op) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const startTime = op.startTime ? this.formatDateTime(op.startTime) : 'N/A';
      const endTime = op.endTime ? this.formatDateTime(op.endTime) : 'N/A';

      doc.font('Helvetica-Bold').text(`${op.operationType}`, 50);
      doc.font('Helvetica');
      doc.text(`Start: ${startTime} | End: ${endTime}`, 50);
      
      if (op.depthFt) {
        doc.text(`Depth: ${op.depthFt} ft`, 50);
      }
      
      if (op.notes) {
        doc.text(`Notes: ${op.notes}`, 50, doc.y, { width: 500 });
      }
      
      doc.moveDown(0.5);
    });

    doc.y = doc.y + 10;
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
      .moveDown(1);
  }

  /**
   * Agrega sección de firmas
   */
  private addSignatureSection(doc: PDFKit.PDFDocument): void {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SIGNATURES')
      .moveDown(1);

    const leftColumn = 50;
    const rightColumn = 320;
    let y = doc.y;

    doc.fontSize(10).font('Helvetica');

    doc.text('CT Supervisor:', leftColumn, y);
    doc
      .moveTo(leftColumn + 100, y + 15)
      .lineTo(leftColumn + 250, y + 15)
      .stroke();
    doc.text('Date:', leftColumn, y + 25);
    doc
      .moveTo(leftColumn + 40, y + 40)
      .lineTo(leftColumn + 250, y + 40)
      .stroke();

    doc.text('CT Operator:', rightColumn, y);
    doc
      .moveTo(rightColumn + 90, y + 15)
      .lineTo(rightColumn + 240, y + 15)
      .stroke();
    doc.text('Date:', rightColumn, y + 25);
    doc
      .moveTo(rightColumn + 40, y + 40)
      .lineTo(rightColumn + 240, y + 40)
      .stroke();

    y += 80;
    doc.y = y;

    doc.text('Company Representative:', leftColumn, y);
    doc
      .moveTo(leftColumn + 150, y + 15)
      .lineTo(leftColumn + 250, y + 15)
      .stroke();
    doc.text('Date:', leftColumn, y + 25);
    doc
      .moveTo(leftColumn + 40, y + 40)
      .lineTo(leftColumn + 250, y + 40)
      .stroke();
  }

  /**
   * Agrega pie de página
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Generated by PetroEdge SCADA+ERP | ${this.formatDateTime(new Date())}`,
          50,
          750,
          { align: 'center', width: 512 }
        );
      
      doc.text(`Page ${i + 1} of ${pageCount}`, 50, 765, {
        align: 'center',
        width: 512,
      });
    }
  }

  /**
   * Agrega marca de agua
   */
  private addWatermark(doc: PDFKit.PDFDocument, text: string): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.save();
      doc
        .fontSize(60)
        .font('Helvetica-Bold')
        .fillColor('gray', 0.1)
        .rotate(-45, { origin: [306, 396] })
        .text(text, 150, 350, { align: 'center', width: 400 });
      doc.restore();
    }
  }

  /**
   * Utilidades de formato
   */
  private addField(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    label: string,
    value: string
  ): void {
    doc.font('Helvetica-Bold').text(label, x, y);
    doc.font('Helvetica').text(value, x + 100, y);
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      DRAFT: '#6B7280',
      PLANNED: '#3B82F6',
      IN_PROGRESS: '#F59E0B',
      COMPLETED: '#10B981',
      CANCELLED: '#EF4444',
    };
    return colors[status] || '#000000';
  }
}
