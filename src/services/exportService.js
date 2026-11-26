import * as XLSX from "xlsx";

function buildRowsAndTotals(items, scopeContext = "") {
  const rows = items.map((item, index) => {
    const countedQty = Number(item.counted_qty || 0);
    const purchasePrice = Number(item.purchase_price || 0);
    const salePrice = Number(item.sale_price || 0);

    return {
      id: index + 1,
      item_name: item.item_name,
      unit: item.unit,
      counted_qty: countedQty,
      purchase_price: purchasePrice,
      sale_price: salePrice,
      row_purchase_total: Number((countedQty * purchasePrice).toFixed(2)),
      row_sale_total: Number((countedQty * salePrice).toFixed(2)),
      expiry_date: item.expiry_date || "",
      updated_at: item.updated_at,
    };
  });

  const totalCountedQty = Number(
    rows.reduce((sum, r) => sum + r.counted_qty, 0).toFixed(2)
  );
  const totalPurchaseAmount = Number(
    rows.reduce((sum, r) => sum + r.row_purchase_total, 0).toFixed(2)
  );
  const totalSaleAmount = Number(
    rows.reduce((sum, r) => sum + r.row_sale_total, 0).toFixed(2)
  );

  return {
    rows,
    summary: {
      scope_context: scopeContext,
      items_count: rows.length,
      total_counted_qty: totalCountedQty,
      total_purchase_amount: totalPurchaseAmount,
      total_sale_amount: totalSaleAmount,
    },
  };
}

function getTimestampName() {
  const now = new Date();
  return `stocktake_${now.toISOString().slice(0, 10)}_${now.getHours()}-${now.getMinutes()}`;
}

export function exportToJSON(items, scopeContext = "") {
  const { rows, summary } = buildRowsAndTotals(items, scopeContext);
  const payload = {
    exported_at: new Date().toISOString(),
    summary,
    items: rows,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, `${getTimestampName()}.json`);
}

function appendTotalRow(rows, summary) {
  return [
    ...rows,
    {
      id: "",
      item_name: "الإجمالي العام (جملة الجرد)",
      unit: "",
      counted_qty: summary.total_counted_qty,
      purchase_price: "",
      sale_price: "",
      row_purchase_total: summary.total_purchase_amount,
      row_sale_total: summary.total_sale_amount,
      expiry_date: "",
      updated_at: "",
    },
  ];
}

export function exportToExcel(items, scopeContext = "") {
  const { rows, summary } = buildRowsAndTotals(items, scopeContext);
  const worksheet = XLSX.utils.json_to_sheet(appendTotalRow(rows, summary));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stocktake");
  XLSX.writeFile(workbook, `${getTimestampName()}.xlsx`);
}

export function exportToCSV(items, scopeContext = "") {
  const { rows, summary } = buildRowsAndTotals(items, scopeContext);
  const worksheet = XLSX.utils.json_to_sheet(appendTotalRow(rows, summary));
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(["\uFEFF" + csvOutput], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, `${getTimestampName()}.csv`);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
