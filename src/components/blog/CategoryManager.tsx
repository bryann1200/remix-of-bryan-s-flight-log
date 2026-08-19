import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { deleteCategory, saveCategory, type Category } from "@/lib/blog";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function CategoryManager({
  open,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#0071E3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const key = slugify(label);
    if (!key) return;
    setBusy(true);
    setError(null);
    try {
      await saveCategory({ key, label: label.trim(), color, sort: categories.length });
      setLabel("");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the category.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(key: string) {
    setBusy(true);
    try {
      await deleteCategory(key);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-hairline bg-card p-7">
        <p className="meta text-ink-soft">Categories</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Your log categories</h2>

        <ul className="mt-5 divide-y divide-hairline">
          {categories.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="color"
                  defaultValue={c.color ?? "#0071E3"}
                  onChange={(e) =>
                    void saveCategory({
                      key: c.key,
                      label: c.label,
                      color: e.target.value,
                      sort: c.sort,
                    }).then(onSaved)
                  }
                  className="h-6 w-6 cursor-pointer rounded border border-hairline bg-transparent"
                  aria-label={`Colour for ${c.label}`}
                />
                {c.label}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(c.key)}
                className="meta text-destructive hover:opacity-70"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2 border-t border-hairline pt-4">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="New category"
            className="flex-1 rounded-lg border border-hairline bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-10 cursor-pointer rounded border border-hairline bg-transparent"
            aria-label="New category colour"
          />
          <button
            type="button"
            disabled={busy || !label.trim()}
            onClick={() => void add()}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}