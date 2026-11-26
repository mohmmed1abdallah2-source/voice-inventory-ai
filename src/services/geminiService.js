const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function parseVoiceCommand(
  spokenText,
  apiKey,
  catalog = [],
  scopeContext = ""
) {
  if (!apiKey) {
    throw new Error("يرجى إدخال مفتاح Gemini API أولاً من الإعدادات.");
  }

  const catalogPreview = catalog
    .slice(0, 300)
    .map(
      (c) =>
        `${c.item_name} (${c.unit}) [شراء:${c.purchase_price || 0}, بيع:${c.sale_price || 0}, انتهاء:${c.expiry_date || ""}]`
    )
    .join(" | ");

  const systemInstruction = `
أنت مساعد ذكي متخصص في جرد البضائع الفعلي (صيدليات، بقالات، مخازن) باللغة العربية واللهجات العامية.
مهمتك تحليل النص الصوتي القادم وتحويله إلى مصفوفة JSON من العمليات.

نطاق الجرد المحدد مسبقاً من المستخدم في هذه الجلسة:
${scopeContext || "عام (بقالة أو صيدلية أو مخزن)"}

قائمة الأصناف المرجعية المعتمدة (إن وُجدت):
${catalogPreview || "لا توجد قائمة مرجعية سابقة"}

القواعد الصارمة:
1. استخرج كل صنف مذكور في الجملة كعنصر مستقل في المصفوفة، مستعيناً بنطاق الجرد لفهم المصطلحات والأسماء بدقة.
2. إذا كان الصنف المنطوق قريباً أو مطابقاً لصنف في القائمة المرجعية، اعتمد اسمه ووحدته وأسعاره إن لم يُذكر جديد.
3. وحدات القياس المعتمدة: ("حبة"، "كرتون"، "باكت"، "شريط"، "علبة"، "قارورة"، "كيس"، "جرام"، "مل") أو أي وحدة صريحة يذكرها المستخدم.
   - في الصيدليات إذا لم تُذكر وحدة وذكرت كلمة شريط/علبة/حبة فالتزم بها، وإلا فالوحدة الافتراضية "علبة" في نطاق الصيدلية أو "حبة" في غيرها.
4. تاريخ الانتهاء "expiry_date":
   - إذا ذكر المستخدم تاريخ انتهاء (مثال: "ينتهي 12/2027" أو "صلاحية 2026-08-15" أو "ينتهي شهر 6 سنة 27")، حوّله إلى صيغة نصية واضحة مثل "2027-12" أو "2026-08-15".
   - إذا لم يُذكر تاريخ انتهاء، اجعله "".
5. حدد نوع العملية "action":
   - "add": لإضافة أو جمع كمية مجرودة على نفس الصنف والوحدة (الافتراضي).
   - "update": لتعديل الكمية المجرودة أو الأسعار أو تاريخ الانتهاء لصنف موجود.
   - "delete": لحذف صنف محدد.
   - "delete_last": إذا قال "احذف الأخير" أو "تراجع".
6. الحقول المطلوبة لكل عنصر:
   - "action": ("add" | "update" | "delete" | "delete_last")
   - "item_name": اسم الصنف نظيفاً.
   - "unit": وحدة القياس.
   - "counted_qty": الكمية المجرودة كرقم (Number).
   - "purchase_price": سعر الشراء للوحدة كرقم (0 إذا لم يُذكر).
   - "sale_price": سعر البيع للوحدة كرقم (0 إذا لم يُذكر).
   - "expiry_date": نص تاريخ الانتهاء أو "".

أرجع النتيجة بصيغة JSON Array صالحة فقط بدون أي نص إضافي أو علامات Markdown.
`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: spokenText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "فشل الاتصال بخدمة الذكاء الاصطناعي");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  return JSON.parse(rawText);
}
