import ExcelJS from "exceljs";
import { formatDob } from "./dob";
import { relationText } from "./caseOptions";

function formatAddress(c) {
  const a = c.caseType === "old" ? c.address : c.presentAddress;
  if (!a) return "";
  return `UC ${a.uc}, Tehsil ${a.tehsil}, District ${a.district}`;
}

const THIN_BORDER = { style: "thin", color: { argb: "FF000000" } };

// Matches the on-screen ledger table and the paper register it replaces —
// a running serial number and the certificate number Social Welfare punches
// in, rather than this app's own internal case number. Real cell styling
// (bold text, fixed column widths, borders) requires a library that can
// actually write it — xlsx (SheetJS)'s free build can't, exceljs can.
export async function buildCompletedCasesWorkbook(cases, sheetName = "Completed Cases") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: "S.#", key: "sno", width: 5 },
    { header: "Name of Disable Person / Father's or Husband's Name", key: "name", width: 28 },
    { header: "Type/Nature of Disability", key: "disability", width: 20 },
    { header: "Fit / Unfit", key: "fitness", width: 10.5 },
    { header: "Date of Birth", key: "dob", width: 11 },
    { header: "CNIC No.", key: "cnic", width: 15 },
    { header: "Address", key: "address", width: 28 },
    { header: "Contact Cell No.", key: "phone", width: 13 },
    { header: "Certificate No.", key: "certNo", width: 14 },
  ];

  cases.forEach((c, i) => {
    sheet.addRow({
      sno: i + 1,
      name: `${c.name} ${relationText(c)}`,
      disability: c.natureOfDisability,
      fitness: c.fitness || "",
      dob: formatDob(c.dob, c.dobYearOnly),
      cnic: c.cnic,
      address: formatAddress(c),
      phone: c.phone,
      certNo: c.certificateNo || "",
    });
  });

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };
    });
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9E6DD" } };
      });
    }
  });

  return workbook;
}
