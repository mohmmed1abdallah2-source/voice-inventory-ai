import React from "react";
import { Trash2, Plus, Minus } from "lucide-react";

const UNITS = [
  "حبة",
  "كرتون",
  "باكت",
  "شريط",
  "علبة",
  "قارورة",
  "كيس",
  "جرام",
  "مل",
];

export default function InventoryTable({ items, onUpdateItem, onDeleteItem }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-slate-400">
        <p className="text-lg font-bold mb-1">ابدأ الجرد الفعلي بالصوت</p>
        <p className="text-sm">حدد نوع البضاعة بالأعلى ثم اضغط الميكروفون وعدّ الأصناف</p>
        <p className="text-xs mt-3 bg-slate-100 inline-block px-3 py-1.5 rounded-full text-slate-500">
          مثال: "5 شرائط بنادول شراء 150 بيع 250 ينتهي 2027-08"
        </p>
      </div>
    );
  }

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

  const unitOptions = (currentUnit) =>
    currentUnit && !UNITS.includes(currentUnit) ? [currentUnit, ...UNITS] : UNITS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-44 space-y-2.5">
      {items.map((item) => {
        const qty = Number(item.counted_qty || 0);
        const pPrice = Number(item.purchase_price || 0);
        const sPrice = Number(item.sale_price || 0);

        return (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.item_name}
                  onChange={(e) =>
                    onUpdateItem(item.id, { item_name: e.target.value })
                  }
                  className="font-bold text-slate-800 text-base flex-1 bg-transparent focus:outline-none focus:underline truncate"
                />
                <select
                  value={item.unit || "حبة"}
                  onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                  className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 shrink-0 focus:outline-none"
                >
                  {unitOptions(item.unit).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                <label className="flex items-center gap-1">
                  <span>شراء:</span>
                  <input
                    type="number"
                    value={item.purchase_price || ""}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdateItem(item.id, {
                        purchase_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-20 border border-amber-200 bg-amber-50/40 rounded px-1.5 py-0.5 text-center font-bold text-amber-900"
                  />
                </label>

                <label className="flex items-center gap-1">
                  <span>بيع:</span>
                  <input
                    type="number"
                    value={item.sale_price || ""}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdateItem(item.id, {
                        sale_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-20 border border-emerald-200 bg-emerald-50/40 rounded px-1.5 py-0.5 text-center font-bold text-emerald-900"
                  />
                </label>

                <label className="flex items-center gap-1">
                  <span>الانتهاء:</span>
                  <input
                    type="text"
                    value={item.expiry_date || ""}
                    placeholder="YYYY-MM"
                    onChange={(e) =>
                      onUpdateItem(item.id, { expiry_date: e.target.value })
                    }
                    className="w-24 border border-slate-200 bg-slate-50 rounded px-1.5 py-0.5 text-center font-medium text-slate-700"
                  />
                </label>

                <span className="text-[11px] text-slate-400">
                  إجمالي الصنف: شراء {(qty * pPrice).toLocaleString()} | بيع{" "}
                  {(qty * sPrice).toLocaleString()}
                </span>
              </div>
            </div>

            {/* الكمية المجرودة */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() =>
                    onUpdateItem(item.id, {
                      counted_qty: Math.max(0, qty - 1),
                    })
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={item.counted_qty}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      counted_qty: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-14 text-center font-extrabold text-lg text-blue-700 bg-transparent focus:outline-none"
                />
                <button
                  onClick={() =>
                    onUpdateItem(item.id, {
                      counted_qty: qty + 1,
                    })
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-2 text-slate-400 hover:text-rose-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* نهاية الجرد: جملة الشراء وجملة البيع */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 mt-4 shadow-md">
        <div className="text-xs text-slate-300 font-bold mb-2">
          نهاية الجرد — جملة الأسعار
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-800 rounded-xl p-3">
            <div className="text-xs text-amber-300">جملة سعر الشراء</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">
              {totalPurchase.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-3">
            <div className="text-xs text-emerald-300">جملة سعر البيع</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
              {totalSale.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
