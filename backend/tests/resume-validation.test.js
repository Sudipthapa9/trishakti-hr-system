const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateResume } = require("../src/modules/applications/resume-validation");

test("resume format and size validation", async () => {
  const docx = Buffer.from("UEsDBBQAAAAIAEq5aV2T+DSMdQAAAJcAAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbD2OMQrDMAwAvxK8ltofcLJ0bzv0A8JWisCSjOwm6e+LKWQ+7rj4+lZsS3xsaEYZpydYvwPj7MKulkPW9GGU7g8ubrqpdJQ+pNlBrYUSdFIJm2SvFeXgsqox9HbVdaWEpz9q1TRhayRvLv4kDCSXkQ9LDP+fH1BLAwQUAAAACABKuWldOalu4mEAAAB3AAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sRc0xDoAgDEDRqxgPYI2DA0HugoBoQltCMejtjYNx+nnT1015dicGqt2FiUS1pd9rzQpA3B7QysA50IVp44K2ysAlQuPic2EXRA6KmGAaxxnQHtQb3dTK/n6bwWj4CP/KPFBLAQIUABQAAAAIAEq5aV2T+DSMdQAAAJcAAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQAFAAAAAgASrlpXTmpbuJhAAAAdwAAABEAAAAAAAAAAAAAAIABpgAAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAACAAIAgAAAADYBAAAAAA==", "base64");
  assert.equal(await validateResume({ originalname: "resume.docx", size: docx.length, buffer: docx }),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  await assert.rejects(() => validateResume({ originalname: "resume.pdf", size: docx.length, buffer: docx }));
  await assert.rejects(() => validateResume({ originalname: "resume.docx", size: 4, buffer: Buffer.from("fake") }));
  await assert.rejects(() => validateResume({ originalname: "resume.exe", size: 4, buffer: Buffer.from("fake") }));
  await assert.rejects(() => validateResume({ originalname: "resume.pdf", size: 10485761, buffer: Buffer.alloc(1) }));
  await assert.rejects(() => validateResume(undefined));
});
