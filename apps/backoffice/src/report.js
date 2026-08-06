const COLORS = { blue: [0, 0, 145], red: [200, 30, 58], green: [26, 138, 95], amber: [154, 107, 10], gray: [90, 97, 128], dark: [22, 22, 22] };
const MARGIN = 48;
const FOOTER_HEIGHT = 70;
const SITE_URL = 'passeport-ia.fr';

function slug(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function downloadReportPdf({ contact, result, logoUrl }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 44;

  const logo = logoUrl ? await loadImage(logoUrl).catch(() => null) : null;
  const logoRatio = logo ? logo.naturalHeight / logo.naturalWidth : 0;

  const ensureSpace = needed => {
    if (y + needed > pageHeight - FOOTER_HEIGHT) { doc.addPage(); y = 44; }
  };

  if (logo) {
    const headerLogoW = 116; const headerLogoH = headerLogoW * logoRatio;
    doc.addImage(logo, 'PNG', MARGIN, y, headerLogoW, headerLogoH, 'brand-logo');
    y += headerLogoH + 16;
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...COLORS.blue);
    doc.text('Passeport IA', MARGIN, y + 14);
    y += 30;
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...COLORS.gray);
  doc.text('Rapport de diagnostic de conformité AI Act', MARGIN, y);
  y += 26;

  doc.setDrawColor(226, 231, 247); doc.setLineWidth(1); doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 20;

  doc.setFontSize(10); doc.setTextColor(...COLORS.dark);
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  const lines = [
    contact.company && `Entreprise : ${contact.company}`,
    contactName && `Contact : ${contactName}`,
    contact.email && `E-mail : ${contact.email}`,
    contact.sector && `Secteur : ${contact.sector}`,
    `Date : ${new Date(contact.date || Date.now()).toLocaleDateString('fr-FR')}`,
  ].filter(Boolean);
  lines.forEach(line => { doc.text(line, MARGIN, y); y += 15; });
  y += 12;

  const conforme = result.bad.length === 0 && result.partial.length === 0;
  const risk = result.riskScore ?? Math.round(((result.bad.length + result.partial.length * 0.5) / result.total) * 100);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...(conforme ? COLORS.green : COLORS.red));
  doc.text(conforme ? 'CONFORME' : 'NON CONFORME', MARGIN, y);
  doc.setFontSize(12); doc.text(`${risk}% de non-conformité`, pageWidth - MARGIN, y, { align: 'right' });
  y += 28;

  const section = (title, items, tone) => {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.setTextColor(...(tone === 'bad' ? COLORS.red : COLORS.green));
    doc.text(title, MARGIN, y); y += 18;
    if (!items.length) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...COLORS.gray);
      doc.text('Aucun point.', MARGIN, y); y += 20;
      return;
    }
    items.forEach(item => {
      ensureSpace(30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...COLORS.dark);
      doc.text(`• ${item.label}`, MARGIN, y); y += 13;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...COLORS.dark);
      const msgLines = doc.splitTextToSize(item.message, pageWidth - MARGIN * 2 - 12);
      ensureSpace(msgLines.length * 12);
      doc.text(msgLines, MARGIN + 12, y); y += msgLines.length * 12;
      if (item.solution) {
        const solLines = doc.splitTextToSize(`Solution : ${item.solution}`, pageWidth - MARGIN * 2 - 12);
        ensureSpace(solLines.length * 12);
        doc.setTextColor(...COLORS.blue);
        doc.text(solLines, MARGIN + 12, y); y += solLines.length * 12;
        doc.setTextColor(...COLORS.dark);
      }
      y += 9;
    });
    y += 6;
  };

  section('À corriger', [...result.bad, ...result.partial], 'bad');
  section('Conforme', result.good, 'ok');

  ensureSpace(30);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(...COLORS.gray);
  const notice = doc.splitTextToSize('Ce résultat est indicatif : il ne constitue pas une certification de conformité ni un avis juridique.', pageWidth - MARGIN * 2);
  doc.text(notice, MARGIN, y);

  const footerLogoW = 44; const footerLogoH = footerLogoW * logoRatio;
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const lineY = pageHeight - 40;
    doc.setDrawColor(226, 231, 247); doc.setLineWidth(0.75);
    doc.line(MARGIN, lineY, pageWidth - MARGIN, lineY);
    const rowY = lineY + 18;
    if (logo) doc.addImage(logo, 'PNG', MARGIN, rowY - footerLogoH + 4, footerLogoW, footerLogoH, 'brand-logo');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...COLORS.gray);
    doc.text(SITE_URL, pageWidth - MARGIN, rowY, { align: 'right' });
  }

  const filename = `rapport-passeport-ia-${slug(contact.company || contact.lastName) || 'diagnostic'}.pdf`;
  doc.save(filename);
}
