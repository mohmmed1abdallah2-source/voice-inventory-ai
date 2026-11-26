import * as XLSX from "xlsx";

function normalizeCatalogRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row, idx) => {
      const itemName = String(
        row.item_name ?? row.name ?? row.product_name ?? row.title ?? ""
      ).trim();

      if (!itemName) return null;

      const unit = String(
        row.unit ?? row.default_unit ?? row.unit_name ?? "حبة"
      ).trim();

      const purchasePrice = Number(
        row.purchase_price ?? row.cost_price ?? row.buy_price ?? row.cost ?? 0
      );
      const salePrice = Number(
        row.sale_price ?? row.sell_price ?? row.price ?? row.unit_price ?? 0
      );
      const expiryDate = String(
        row.expiry_date ?? row.expire_date ?? row.expiration_date ?? ""
      ).trim();

      return {
        id: row.id ?? `cat_${idx + 1}`,
        item_name: itemName,
        unit: unit || "حبة",
        purchase_price: Number.isFinite(purchasePrice) ? purchasePrice : 0,
        sale_price: Number.isFinite(salePrice) ? salePrice : 0,
        expiry_date: expiryDate,
      };
    })
    .filter(Boolean);
}

export async function parseCatalogFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed.items || parsed.products || parsed.data || [];
    return normalizeCatalogRows(list);
  }

  if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    return normalizeCatalogRows(rows);
  }

  throw new Error("صيغة الملف غير مدعومة. يرجى اختيار ملف JSON أو CSV أو Excel (.xlsx).");
}
