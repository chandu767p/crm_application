const PDFDocument = require('pdfkit');

/**
 * Generates a PDF document for a given data set.
 * @param {Object} data - The data to be included in the PDF.
 * @param {string} title - The title of the PDF document.
 * @param {Stream} stream - The writable stream to pipe the PDF content to.
 */
const generatePDF = (data, title, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text(title, 110, 57)
    .fontSize(10)
    .text('Do Systems CRM', 200, 65, { align: 'right' })
    .text('Inventory & Reports', 200, 80, { align: 'right' })
    .moveDown();

  // Draw line
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, 100)
    .lineTo(550, 100)
    .stroke();

  doc.moveDown();

  // Content
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text(`${index + 1}.`, { continued: true })
        .text(` Name: ${item.name || item.title || 'N/A'}`)
        .fontSize(10)
        .fillColor('#666666')
        .text(`   Details: ${item.email || item.status || item.description || ''}`)
        .moveDown(0.5);
    });
  } else {
    doc
      .fontSize(12)
      .text(JSON.stringify(data, null, 2));
  }

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(10)
      .text(
        `Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: 500 }
      );
  }

  doc.end();
};

module.exports = { generatePDF };
