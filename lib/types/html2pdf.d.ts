/**
 * HTML to PDF Type Definitions
 * 
 * Type definitions for the html2pdf.js library, which converts HTML elements to PDF documents.
 * This module provides TypeScript interfaces for the library's configuration options
 * and instance methods.
 */

declare module 'html2pdf.js' {
  /**
   * HTML to PDF Configuration Options
   * Defines the available options for PDF generation
   * 
   * @interface
   * @property {number} [margin] - PDF page margins
   * @property {string} [filename] - Output PDF filename
   * @property {Object} [image] - Image quality settings
   * @property {string} image.type - Image type (e.g., 'jpeg', 'png')
   * @property {number} image.quality - Image quality (0-1)
   * @property {Object} [html2canvas] - Canvas rendering options
   * @property {number} html2canvas.scale - Canvas scaling factor
   * @property {Object} [jsPDF] - PDF document settings
   * @property {string} jsPDF.unit - Measurement unit (e.g., 'pt', 'mm')
   * @property {string} jsPDF.format - Page format (e.g., 'a4', 'letter')
   * @property {string} jsPDF.orientation - Page orientation ('portrait' or 'landscape')
   */
  interface Html2PdfOptions {
    margin?: number;
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: { scale: number };
    jsPDF?: { unit: string; format: string; orientation: string };
  }

  /**
   * HTML to PDF Instance Interface
   * Defines the methods available on the PDF generation instance
   * 
   * @interface
   * @method set - Configure PDF generation options
   * @method from - Set the source HTML element
   * @method save - Generate and save the PDF
   */
  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    save(): Promise<void>;
  }

  /**
   * HTML to PDF Factory Function
   * Creates a new instance for PDF generation
   * 
   * @returns {Html2PdfInstance} A new PDF generation instance
   */
  function html2pdf(): Html2PdfInstance;
  
  export = html2pdf;
} 