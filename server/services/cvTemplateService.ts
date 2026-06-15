// server/services/cvTemplateService.ts
import PDFDocument from 'pdfkit';

interface CVData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  professionalSummary: string;
  experience: Array<{
    jobTitle: string;
    employer: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrentJob: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    location?: string;
    graduationDate: string;
  }>;
  skills: string[];
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  references?: Array<{
    name: string;
    position: string;
    company: string;
    email: string;
    phone: string;
  }>;
}

const emptyToFallback = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const cleanList = <T>(items: T[] | undefined, hasContent: (item: T) => boolean) =>
  Array.isArray(items) ? items.filter(hasContent) : [];

export function createCvFileName(fullName: string) {
  const baseName = emptyToFallback(fullName, 'workwise-cv')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${baseName || 'workwise-cv'}-cv.pdf`;
}

export async function generateCVPDF(data: CVData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 44, bottom: 44, left: 56, right: 56 },
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `${emptyToFallback(data.personalInfo.fullName, 'WorkWise')} CV`,
          Author: 'WorkWise SA',
          Subject: 'Generated CV',
        },
      });

      const buffers: Buffer[] = [];
      const pageBottom = doc.page.height - doc.page.margins.bottom;
      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const muted = '#4b5563';
      const primary = '#163b6d';
      const border = '#dbeafe';

      const ensureSpace = (height: number) => {
        if (doc.y + height > pageBottom) {
          doc.addPage();
        }
      };

      const sectionTitle = (title: string) => {
        ensureSpace(44);
        doc.moveDown(0.6);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(primary).text(title.toUpperCase());
        doc
          .moveTo(doc.page.margins.left, doc.y + 4)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
          .strokeColor(border)
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.7);
      };

      const paragraph = (text: string) => {
        if (!text.trim()) return;
        ensureSpace(doc.heightOfString(text, { width: contentWidth }) + 12);
        doc.font('Helvetica').fontSize(10).fillColor('#111827').text(text, {
          width: contentWidth,
          lineGap: 3,
        });
        doc.moveDown(0.5);
      };

      const bulletText = (text: string) => {
        const lines = text
          .split(/\r?\n/)
          .map(line => line.replace(/^[-*•]\s*/, '').trim())
          .filter(Boolean);

        if (lines.length === 0 && text.trim()) {
          lines.push(text.trim());
        }

        lines.forEach(line => {
          ensureSpace(doc.heightOfString(line, { width: contentWidth - 18 }) + 10);
          const startY = doc.y;
          doc.font('Helvetica-Bold').fontSize(10).fillColor(primary).text('•', {
            continued: true,
            width: 14,
          });
          doc.y = startY;
          doc.x = doc.page.margins.left + 16;
          doc.font('Helvetica').fontSize(10).fillColor('#111827').text(line, {
            width: contentWidth - 18,
            lineGap: 2,
          });
          doc.x = doc.page.margins.left;
          doc.moveDown(0.2);
        });
      };

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const name = emptyToFallback(data.personalInfo.fullName, 'WorkWise Candidate');
      const contact = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.address,
      ]
        .map(value => emptyToFallback(value))
        .filter(Boolean)
        .join(' | ');

      doc.rect(0, 0, doc.page.width, 116).fill(primary);
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(name, doc.page.margins.left, 36, { width: contentWidth, align: 'center' });
      if (contact) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#dbeafe')
          .text(contact, doc.page.margins.left, 72, { width: contentWidth, align: 'center' });
      }
      doc.y = 138;

      sectionTitle('Professional Summary');
      paragraph(emptyToFallback(data.professionalSummary));

      const experience = cleanList(
        data.experience,
        exp => Boolean(exp.jobTitle?.trim() || exp.employer?.trim() || exp.description?.trim())
      );
      if (experience.length) {
        sectionTitle('Work Experience');
        experience.forEach(exp => {
          const title = [exp.jobTitle, exp.employer].map(value => emptyToFallback(value)).filter(Boolean);
          const dates = `${emptyToFallback(exp.startDate, 'Start date')} - ${
            exp.isCurrentJob ? 'Present' : emptyToFallback(exp.endDate, 'End date')
          }`;

          ensureSpace(60);
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(title.join(' at '));
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(muted)
            .text([dates, emptyToFallback(exp.location)].filter(Boolean).join(' | '));
          doc.moveDown(0.35);
          bulletText(emptyToFallback(exp.description));
          doc.moveDown(0.35);
        });
      }

      const education = cleanList(
        data.education,
        edu => Boolean(edu.degree?.trim() || edu.school?.trim())
      );
      if (education.length) {
        sectionTitle('Education');
        education.forEach(edu => {
          ensureSpace(44);
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(emptyToFallback(edu.degree));
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(muted)
            .text(
              [edu.school, edu.location, edu.graduationDate]
                .map(value => emptyToFallback(value))
                .filter(Boolean)
                .join(' | ')
            );
          doc.moveDown(0.6);
        });
      }

      const skills = cleanList(data.skills, skill => Boolean(skill?.trim()));
      if (skills.length) {
        sectionTitle('Skills');
        paragraph(skills.map(skill => emptyToFallback(skill)).join(' • '));
      }

      const languages = cleanList(data.languages, lang => Boolean(lang.language?.trim()));
      if (languages.length) {
        sectionTitle('Languages');
        paragraph(
          languages
            .map(lang => `${emptyToFallback(lang.language)} (${emptyToFallback(lang.proficiency)})`)
            .join(' • ')
        );
      }

      const references = cleanList(
        data.references,
        ref => Boolean(ref.name?.trim() || ref.company?.trim() || ref.email?.trim() || ref.phone?.trim())
      );
      if (references.length) {
        sectionTitle('References');
        references.forEach(ref => {
          ensureSpace(44);
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(emptyToFallback(ref.name));
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(muted)
            .text(
              [ref.position, ref.company, ref.email, ref.phone]
                .map(value => emptyToFallback(value))
                .filter(Boolean)
                .join(' | ')
            );
          doc.moveDown(0.5);
        });
      }

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i += 1) {
        doc.switchToPage(i);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#6b7280')
          .text(
            `Generated by WorkWise SA • Page ${i + 1} of ${range.count}`,
            doc.page.margins.left,
            doc.page.height - 30,
            { width: contentWidth, align: 'center' }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
