import React, { useState, useEffect, useCallback } from "react";
import HeaderStats from "./components/HeaderStats";
import InventoryTable from "./components/InventoryTable";
import VoiceControl from "./components/VoiceControl";
import { parseVoiceCommand } from "./services/geminiService";
import { parseCatalogFile } from "./services/catalogService";

const STORAGE_KEY = "stocktake_items_v3";
const CATALOG_STORAGE_KEY = "stocktake_catalog_v3";
const SCOPE_STORAGE_KEY = "stocktake_scope_v3";
const API_KEY_STORAGE = "gemini_api_key_v1";

function speakConfirmation(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 1.2;
    window.speechSynthesis.speak(utterance);
  }
}

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [catalog, setCatalog] = useState(() => {
    const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [scopeContext, setScopeContext] = useState(
    () => localStorage.getItem(SCOPE_STORAGE_KEY) || ""
  );
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || "");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem(SCOPE_STORAGE_KEY, scopeContext);
  }, [scopeContext]);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  };

  const handleImportCatalog = async (file) => {
    try {
      const imported = await parseCatalogFile(file);
      if (imported.length === 0) {
        alert("لم يتم العثور على أصناف صالحة في الملف.");
        return;
      }
      setCatalog(imported);
      alert(`تم استيراد ${imported.length} صنف إلى القائمة المرجعية.`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearCatalog = () => {
    if (confirm("هل تريد إزالة القائمة المرجعية المستوردة؟")) {
      setCatalog([]);
    }
  };

  const findCatalogMatch = (name, unit) => {
    const cleanName = name.trim().toLowerCase();
    const cleanUnit = (unit || "").trim().toLowerCase();
    return (
      catalog.find(
        (c) =>
          c.item_name.trim().toLowerCase() === cleanName &&
          (!cleanUnit || c.unit.trim().toLowerCase() === cleanUnit)
      ) || catalog.find((c) => c.item_name.trim().toLowerCase() === cleanName)
    );
  };

  const handleCommandSubmit = useCallback(
    async (spokenText) => {
      setIsProcessing(true);
      try {
        const actions = await parseVoiceCommand(
          spokenText,
          apiKey,
          catalog,
          scopeContext
        );

        setItems((prevItems) => {
          let updated = [...prevItems];

          actions.forEach((act) => {
            if (act.action === "delete_last") {
              updated.shift();
              return;
            }

            const matchedCatalog = findCatalogMatch(act.item_name, act.unit);
            const resolvedName = matchedCatalog
              ? matchedCatalog.item_name
              : act.item_name;
            const resolvedUnit = act.unit || matchedCatalog?.unit || "حبة";
            const qty = Number(act.counted_qty ?? act.quantity ?? 0);
            const pPrice =
              Number(act.purchase_price) > 0
                ? Number(act.purchase_price)
                : Number(matchedCatalog?.purchase_price || 0);
            const sPrice =
              Number(act.sale_price) > 0
                ? Number(act.sale_price)
                : Number(matchedCatalog?.sale_price || 0);
            const expiryDate =
              (act.expiry_date || "").trim() || matchedCatalog?.expiry_date || "";

            const existingIndex = updated.findIndex(
              (i) =>
                i.item_name.trim() === resolvedName.trim() &&
                i.unit.trim() === resolvedUnit.trim()
            );

            if (act.action === "delete" && existingIndex !== -1) {
              updated.splice(existingIndex, 1);
            } else if (act.action === "update" && existingIndex !== -1) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                counted_qty: qty,
                purchase_price: pPrice || updated[existingIndex].purchase_price,
                sale_price: sPrice || updated[existingIndex].sale_price,
                expiry_date: expiryDate || updated[existingIndex].expiry_date,
                updated_at: new Date().toISOString(),
              };
            } else if (act.action === "add") {
              if (existingIndex !== -1) {
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  counted_qty: Number(updated[existingIndex].counted_qty || 0) + qty,
                  purchase_price: pPrice || updated[existingIndex].purchase_price,
                  sale_price: sPrice || updated[existingIndex].sale_price,
                  expiry_date: expiryDate || updated[existingIndex].expiry_date,
                  updated_at: new Date().toISOString(),
                };
              } else {
                updated.unshift({
                  id: crypto.randomUUID(),
                  item_name: resolvedName,
                  unit: resolvedUnit,
                  counted_qty: qty,
                  purchase_price: pPrice,
                  sale_price: sPrice,
                  expiry_date: expiryDate,
                  updated_at: new Date().toISOString(),
                });
              }
            }
          });

          return updated;
        });

        if (actions.length > 0) {
          speakConfirmation(`تم تسجيل ${actions.length} صنف`);
        }
      } catch (error) {
        alert(error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [apiKey, catalog, scopeContext]
  );

  const handleUpdateItem = (id, changes) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...changes, updated_at: new Date().toISOString() }
          : item
      )
    );
  };

  const handleDeleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("هل أنت متأكد من مسح جميع بيانات الجرد الحالية؟")) {
      setItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderStats
        items={items}
        scopeContext={scopeContext}
        onScopeContextChange={setScopeContext}
        catalogCount={catalog.length}
        onImportCatalog={handleImportCatalog}
        onClearCatalog={handleClearCatalog}
        onClearAll={handleClearAll}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
      <InventoryTable
        items={items}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
      />
      <VoiceControl onCommandSubmit={handleCommandSubmit} isProcessing={isProcessing} />
    </div>
  );
}
