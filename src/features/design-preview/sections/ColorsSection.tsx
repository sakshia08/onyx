import { BUCKET_COLORS } from "@/domain/bucket-colors";
import { PreviewSection } from "../PreviewSection";

const GROUPS: { title: string; tokens: { name: string; value: string }[] }[] = [
  {
    title: "Surfaces",
    tokens: [
      { name: "bg", value: "#09090B" },
      { name: "surface-1", value: "#121215" },
      { name: "surface-2", value: "#1A1A1F" },
      { name: "surface-3", value: "#24242B" },
    ],
  },
  {
    title: "Text",
    tokens: [
      { name: "text-1", value: "#F5F5F7" },
      { name: "text-2", value: "#A1A1AA" },
      { name: "text-3", value: "#83838D" },
      { name: "hairline", value: "7% white" },
    ],
  },
  {
    title: "Accent and status",
    tokens: [
      { name: "accent-a", value: "#7C6CFF" },
      { name: "accent-b", value: "#3E8BFF" },
      { name: "accent-c", value: "#FF9E7A" },
      { name: "positive", value: "#4ADE80" },
      { name: "warning", value: "#FFB547" },
      { name: "negative", value: "#FF5A5F" },
      { name: "piggy", value: "#FF8FB8" },
      { name: "piggy-strong", value: "#FF5FA2" },
    ],
  },
];

function Swatch({ cssVar, name, value }: { cssVar: string; name: string; value: string }) {
  return (
    <div className="min-w-0">
      <div
        className="h-12 rounded-inner border border-hairline-strong"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <p className="mt-1.5 text-caption leading-tight [overflow-wrap:anywhere] text-text-1">
        {name}
      </p>
      <p className="mt-0.5 truncate text-micro font-medium tracking-normal text-text-3">{value}</p>
    </div>
  );
}

export function ColorsSection() {
  return (
    <PreviewSection id="colors" title="Colors">
      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-caption text-text-2">{group.title}</h3>
            <div className="grid grid-cols-4 gap-x-2 gap-y-3">
              {group.tokens.map((t) => (
                <Swatch key={t.name} cssVar={`--${t.name}`} name={t.name} value={t.value} />
              ))}
            </div>
          </div>
        ))}
        <div>
          <h3 className="mb-2 text-caption text-text-2">Bucket palette</h3>
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {BUCKET_COLORS.map((color) => (
              <Swatch key={color} cssVar={`--bucket-${color}`} name={color} value="" />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-caption text-text-2">Aurora</h3>
          <div className="aurora grain h-16 rounded-inner border border-hairline-strong">
            <div aria-hidden="true" className="aurora-mesh" />
          </div>
        </div>
      </div>
    </PreviewSection>
  );
}
