const path = require("node:path");
const yauzl = require("yauzl");

// Inspect the DOCX package without extracting files or executing document content.
function validateDocx(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error) return reject(new Error("Choose a valid DOCX file."));
      let count = 0;
      let totalSize = 0;
      let hasDocument = false;
      let hasContentType = false;
      let finished = false;
      function fail() {
        if (finished) return;
        finished = true;
        zip.close();
        reject(new Error("Choose a valid, unencrypted DOCX file."));
      }
      zip.on("error", fail);
      zip.on("entry", (entry) => {
        count += 1;
        totalSize += entry.uncompressedSize;
        if (count > 1000 || totalSize > 50 * 1024 * 1024 ||
            (entry.generalPurposeBitFlag & 1) || /vbaProject\.bin$/i.test(entry.fileName)) {
          return fail();
        }
        if (!["word/document.xml", "[Content_Types].xml"].includes(entry.fileName)) {
          zip.readEntry();
          return;
        }
        if (entry.uncompressedSize > 10 * 1024 * 1024) return fail();
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return fail();
          const chunks = [];
          stream.on("error", fail);
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => {
            if (finished) return;
            const xml = Buffer.concat(chunks).toString("utf8");
            if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return fail();
            if (entry.fileName === "word/document.xml") {
              hasDocument = /<(?:\w+:)?document[\s>]/.test(xml);
            } else {
              hasContentType = xml.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml");
            }
            zip.readEntry();
          });
        });
      });
      zip.on("end", () => {
        if (finished) return;
        finished = true;
        if (hasDocument && hasContentType) resolve();
        else reject(new Error("Choose a valid DOCX file."));
      });
      zip.readEntry();
    });
  });
}

async function validateResume(file) {
  if (!file || !file.size || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a PDF or DOCX file up to 10MB.");
  }
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".pdf") {
    if (!file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-")) ||
        !file.buffer.subarray(-2048).includes(Buffer.from("%%EOF"))) {
      throw new Error("Choose a valid PDF file.");
    }
    return "application/pdf";
  }
  if (extension === ".docx") {
    await validateDocx(file.buffer);
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  throw new Error("Choose a PDF or DOCX file.");
}

module.exports = { validateResume };
