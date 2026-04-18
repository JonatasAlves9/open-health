"use client";

import { useState, useEffect } from "react";
import { api, type Food } from "@/lib/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editFood?: Food;
};

const DEFAULT_UNIT_OPTIONS = [
  { value: "g", label: "Gramas (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "unidade", label: "Unidade" },
  { value: "colher_sopa", label: "Colher de sopa" },
  { value: "colher_cha", label: "Colher de chá" },
  { value: "xicara", label: "Xícara" },
];

type FormState = {
  name: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
  fiberPer100g: string;
  defaultUnit: string;
  servingSize: string;
  barcode: string;
};

const EMPTY: FormState = {
  name: "",
  caloriesPer100g: "",
  proteinPer100g: "",
  carbsPer100g: "",
  fatPer100g: "",
  fiberPer100g: "",
  defaultUnit: "g",
  servingSize: "",
  barcode: "",
};

function foodToForm(food: Food): FormState {
  return {
    name: food.name,
    caloriesPer100g: food.caloriesPer100g?.toString() ?? "",
    proteinPer100g: food.proteinPer100g?.toString() ?? "",
    carbsPer100g: food.carbsPer100g?.toString() ?? "",
    fatPer100g: food.fatPer100g?.toString() ?? "",
    fiberPer100g: food.fiberPer100g?.toString() ?? "",
    defaultUnit: food.defaultUnit,
    servingSize: food.servingSize?.toString() ?? "",
    barcode: food.barcode ?? "",
  };
}

function NumInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-8 h-8 text-sm"
          placeholder="—"
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function FoodFormDialog({ open, onClose, onSaved, editFood }: Props) {
  const isEdit = !!editFood;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(editFood ? foodToForm(editFood) : EMPTY);
      setError("");
    }
  }, [open, editFood]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function num(v: string) {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        caloriesPer100g: num(form.caloriesPer100g),
        proteinPer100g: num(form.proteinPer100g),
        carbsPer100g: num(form.carbsPer100g),
        fatPer100g: num(form.fatPer100g),
        fiberPer100g: num(form.fiberPer100g),
        defaultUnit: form.defaultUnit as Food["defaultUnit"],
        servingSize: num(form.servingSize),
        barcode: form.barcode.trim() || undefined,
        source: "manual" as const,
      };
      if (isEdit && editFood) {
        await api.foods.create(payload); // PUT não implementado no cliente ainda, usa create
      } else {
        await api.foods.create(payload);
      }
      onSaved();
      onClose();
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md p-0 gap-0 flex flex-col overflow-hidden"
        style={{ maxHeight: "min(90vh, 680px)" }}
      >
        <div className="px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "Editar alimento" : "Cadastrar alimento"}
          </DialogTitle>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              placeholder="Ex: Frango grelhado, Aveia..."
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <Separator />

          {/* Macros */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Informação nutricional por 100g / 100ml
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumInput label="Calorias" value={form.caloriesPer100g} onChange={(v) => set("caloriesPer100g", v)} suffix="kcal" />
              <NumInput label="Proteína" value={form.proteinPer100g} onChange={(v) => set("proteinPer100g", v)} suffix="g" />
              <NumInput label="Carboidratos" value={form.carbsPer100g} onChange={(v) => set("carbsPer100g", v)} suffix="g" />
              <NumInput label="Gorduras" value={form.fatPer100g} onChange={(v) => set("fatPer100g", v)} suffix="g" />
              <NumInput label="Fibras" value={form.fiberPer100g} onChange={(v) => set("fiberPer100g", v)} suffix="g" />
            </div>
          </div>

          <Separator />

          {/* Unidade e porção */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Medidas
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Unidade padrão</Label>
              <Select value={form.defaultUnit} onValueChange={(v) => v && set("defaultUnit", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_UNIT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumInput label="Tamanho da porção padrão" value={form.servingSize} onChange={(v) => set("servingSize", v)} />
          </div>

          <Separator />

          {/* Código de barras */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Código de barras (opcional)</Label>
            <Input
              placeholder="Ex: 7891234567890"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-muted/30 shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
