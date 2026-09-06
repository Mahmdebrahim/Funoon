import { useState } from "react";
import { X, Plus } from "lucide-react";

export default function TagsInput({ tags = [], setTags, placeholder = "أضف وسماً..." }) {
    const [input, setInput] = useState("");

    const addTag = () => {
        const tag = input.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setInput("");
    };

    const removeTag = (tag) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 p-3 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors text-sm rounded-lg"
                />
                <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 rounded-lg border border-[var(--color-outline-variant)]/50 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                </button>
            </div>

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium rounded-full"
                        >
                            <span>{tag}</span>
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <p className="text-xs text-[var(--color-on-surface-variant)]">
                أمثلة: تجريدي، سريالي، واقعي، خط عربي، ألوان مائية
            </p>
        </div>
    );
}