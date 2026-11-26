import React, { useRef } from "react";
import {
  FileSpreadsheet,
  FileJson,
  FileText,
  Trash2,
  Key,
  FolderUp,
  Database,
  ClipboardList,
} from "lucide-react";
import { exportToExcel, exportToCSV, exportToJSON } from "../services/exportService";

export default function HeaderStats({
  items,
  scopeContext,
  onScopeContextChange,
  catalogCount,
  onImportCatalog,
  onClearCatalog,
  onClearAll,
  apiKey,
  onSaveApiKey,
}) {
  const fileInputRef = useRef(null);

  const totalItems = items.length;
  const totalCountedQty = items.reduce(
    (sum, item) => sum + Number(item.counted_qty || 0),
    0
  );
  const totalPurchase = items.reduce(
    (sum, item) =>
      sum + Number(item.counted_qty || 0) * Number(item.purchase_price || 0),
    0
  );
  const totalSale = items.reduce(
    (sum, item) =>
      sum + Number(item.counted_qty || 0) * Number(item.sale_price || 0),
    0
  );

  const handleKeyPrompt = () => {
    const newKey = prompt("أدخل مفتاح Gemini API Key:", apiKey || "");
    if (newKey !== null) onSaveApiKey(newKey.trim());
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCatalog(file);
      e.target.value = "";
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h1 className="text-xl font-extrabold text-slate-800 truncate">
            الجرد الفعلي بالصوت
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
            >
              <FolderUp className="w-3.5 h-3.5" />
              استيراد أصناف
            </button>

            <button
              onClick={handleKeyPrompt}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                apiKey
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {apiKey ? "API متصل" : "إعداد API"}
            </button>

            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                title="تصفير الجرد"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* تحديد ما ستقوم بجرده في هذه الجلسة */}
        <div className="mb-2.5 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            value={scopeContext}
            onChange={(e) => onScopeContextChange(e.target.value)}
            placeholder="أخبر النظام ما الذي ستجرده الآن (مثال: أدوية صيدلية، أو عصائر وألبان بقالة)..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-700 focus:outline-none"
          />
        </div>

        {catalogCount > 0 && (
          <div className="mb-2.5 px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5" />
              القائمة المرجعية: <strong>{catalogCount}</strong> صنف
            </span>
            <button
              onClick={onClearCatalog}
              className="text-indigo-600 hover:underline font-bold"
            >
              إزالة القائمة
            </button>
          </div>
        )}

        {/* ملخص الكمية المجرودة وجملة الشراء وجملة البيع */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
          <div className="bg-slate-100 rounded-xl p-2">
            <div className="text-xs text-slate-500">الأصناف</div>
            <div className="text-lg font-extrabold text-slate-800">{totalItems}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-2">
            <div className="text-xs text-blue-600">الكمية المجرودة</div>
            <div className="text-lg font-extrabold text-blue-700">{totalCountedQty}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-2">
            <div className="text-xs text-amber-700">جملة الشراء</div>
            <div className="text-lg font-extrabold text-amber-800">
              {totalPurchase.toLocaleString()}
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2">
            <div className="text-xs text-emerald-700">جملة البيع</div>
            <div className="text-lg font-extrabold text-emerald-800">
              {totalSale.toLocaleString()}
            </div>
          </div>
        </div>

        {/* أزرار التصدير */}
        <div className="grid grid-cols-3 gap-2">
          <button
            disabled={items.length === 0}
            onClick={() => exportToExcel(items, scopeContext)}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-bold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            disabled={items.length === 0}
            onClick={() => exportToCSV(items, scopeContext)}
            className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-bold transition"
          >
            <FileText className="w-4 h-4" />
            CSV
          </button>
          <button
            disabled={items.length === 0}
            onClick={() => exportToJSON(items, scopeContext)}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-bold transition"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>
    </header>
  );
}
