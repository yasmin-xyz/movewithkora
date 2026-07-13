import { Document, Page, View, Text, Image, StyleSheet, Font, Svg, Path, Link, pdf } from "@react-pdf/renderer";
import { parsePlan, type PoseMedia, type Section } from "@/lib/parseClassPlan";
import { getSanskritName } from "@/lib/sanskritNames";

const SITE_URL = "https://movewithkora.vercel.app";

const COLORS = {
  background: "#F9F8F6",
  foreground: "#2A2622",
  card: "#F5F3EF",
  mutedForeground: "#8A8075",
  accent: "#DCE5E0",
  accentForeground: "#334C3E",
  border: "#E5E1DC",
  primary: "#496E59",
};

// ---------------------------------------------------------------------------
// Font & image preloading
//
// @react-pdf/renderer fetches remote fonts/images lazily during layout. If a
// resource is still in flight when a page finishes measuring, that page gets
// laid out with fallback metrics and is never corrected — while later pages
// (rendered after everything's cached) come out fine. That's the exact
// "page 1 is garbled, pages 2-3 are fine" symptom. Fix: fetch everything into
// memory *before* calling pdf().toBlob(), so there's no in-flight network
// dependency during the actual render pass.
// ---------------------------------------------------------------------------

const FONT_FILES: { family: string; weight: number; url: string }[] = [
  { family: "Cormorant Garamond", weight: 400, url: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-400-normal.ttf" },
  { family: "Cormorant Garamond", weight: 500, url: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-500-normal.ttf" },
  { family: "Cormorant Garamond", weight: 600, url: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-600-normal.ttf" },
  { family: "Cormorant Garamond", weight: 700, url: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-700-normal.ttf" },
  { family: "Inter", weight: 400, url: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf" },
  { family: "Inter", weight: 500, url: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf" },
  { family: "Inter", weight: 600, url: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf" },
];

// Baseline registration so the family is known to react-pdf even in the
// worst case (buffer prefetch below fails outright, e.g. offline). Real
// preloading happens in ensureFontsLoaded() and overrides this.
Font.register({ family: "Cormorant Garamond", fonts: FONT_FILES.filter(f => f.family === "Cormorant Garamond").map(f => ({ src: f.url, fontWeight: f.weight })) });
Font.register({ family: "Inter", fonts: FONT_FILES.filter(f => f.family === "Inter").map(f => ({ src: f.url, fontWeight: f.weight })) });
Font.registerHyphenationCallback((word) => [word]);

let fontsLoadedPromise: Promise<void> | null = null;

function ensureFontsLoaded(): Promise<void> {
  if (fontsLoadedPromise) return fontsLoadedPromise;
  fontsLoadedPromise = (async () => {
    const results = await Promise.all(
      FONT_FILES.map(async (f) => {
        try {
          const res = await fetch(f.url);
          if (!res.ok) return null;
          const buffer = await res.arrayBuffer();
          return { ...f, buffer };
        } catch {
          return null; // this one font falls back to the URL-based registration above
        }
      })
    );
    const byFamily = new Map<string, { src: ArrayBuffer; fontWeight: number }[]>();
    for (const r of results) {
      if (!r) continue;
      const list = byFamily.get(r.family) ?? [];
      list.push({ src: r.buffer, fontWeight: r.weight });
      byFamily.set(r.family, list);
    }
    for (const [family, fonts] of byFamily.entries()) {
      if (fonts.length > 0) Font.register({ family, fonts });
    }
  })();
  return fontsLoadedPromise;
}

async function preloadImages(urls: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const map: Record<string, string> = {};
  await Promise.all(
    unique.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        map[url] = dataUri;
      } catch {
        // Skip — component falls back to the remote URL for this one image.
      }
    })
  );
  return map;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    color: COLORS.foreground,
    fontFamily: "Inter",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 44,
  },
  mastheadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 600,
    fontSize: 15,
    color: COLORS.foreground,
    marginLeft: 6,
  },
  logoSubtext: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 6.5,
    color: COLORS.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 6,
    marginTop: 1,
  },
  generatedText: {
    fontFamily: "Inter",
    fontSize: 8,
    color: COLORS.mutedForeground,
  },
  mastheadRule: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 18,
  },
  title: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 600,
    fontSize: 26,
    color: COLORS.foreground,
  },
  paramsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  paramItem: {
    flexDirection: "row",
    marginRight: 14,
    marginBottom: 2,
  },
  paramLabel: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 8.5,
    color: "#5C6B55",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  paramValue: {
    fontFamily: "Inter",
    fontSize: 8.5,
    color: COLORS.foreground,
    marginLeft: 3,
  },
  inspiration: {
    fontFamily: "Inter",
    fontSize: 9,
    fontStyle: "italic",
    color: COLORS.mutedForeground,
    marginTop: 6,
  },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 14,
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.foreground,
    paddingBottom: 5,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 700,
    fontSize: 16,
    color: COLORS.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionMinutes: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 700,
    fontSize: 10,
    color: COLORS.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  blockWrap: {
    marginBottom: 14,
  },
  blockHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 7,
  },
  blockName: {
    fontFamily: "Inter",
    fontSize: 10.5,
    color: COLORS.mutedForeground,
  },
  blockDuration: {
    fontFamily: "Inter",
    fontSize: 8.5,
    color: COLORS.mutedForeground,
  },
  poseCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  poseImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginRight: 9,
    objectFit: "contain",
  },
  poseTextWrap: {
    flex: 1,
  },
  poseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  poseName: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 10.5,
    color: COLORS.foreground,
  },
  poseSanskrit: {
    fontFamily: "Inter",
    fontStyle: "italic",
    fontSize: 9,
    color: COLORS.mutedForeground,
  },
  selectedBadge: {
    fontFamily: "Inter",
    fontSize: 6.5,
    fontWeight: 500,
    color: COLORS.accentForeground,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
  },
  // NOTE: no flexDirection here. This is applied to a <Text>, not a <View> —
  // giving a Text node a row flex direction was the other half of the page-1
  // corruption bug (react-pdf's text layout doesn't expect flex on inline
  // text runs, and combined with the async font/image race it produced
  // overlapping duplicate-looking text). Nested <Text> inside <Text> flows
  // inline on its own; it doesn't need a flex container.
  poseDetailRow: {
    fontSize: 9,
    color: COLORS.mutedForeground,
    marginTop: 1,
  },
  poseDetailLabel: {
    fontFamily: "Inter",
    fontWeight: 500,
    color: "#5C6B55",
  },
  transitionBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  transitionLabel: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 9,
    color: COLORS.mutedForeground,
  },
  transitionDetail: {
    fontFamily: "Inter",
    fontSize: 8,
    color: COLORS.mutedForeground,
    marginTop: 1.5,
  },
  sideFlowLabel: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 8,
    color: COLORS.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: COLORS.mutedForeground,
    textAlign: "center",
  },
});

// Lotus mark, ported from the planner page's inline SVG (Index.tsx).
const LotusLogo = () => (
  <Svg viewBox="0 0 200 105" style={{ width: 30, height: 16 }}>
    <Path d="M100 78 C82 66, 32 52, 6 64 C4 72, 28 84, 60 86 C78 86, 94 82, 100 78Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
    <Path d="M100 78 C118 66, 168 52, 194 64 C196 72, 172 84, 140 86 C122 86, 106 82, 100 78Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
    <Path d="M100 76 C86 58, 50 24, 36 12 C30 16, 38 38, 56 56 C70 68, 88 76, 100 76Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
    <Path d="M100 76 C114 58, 150 24, 164 12 C170 16, 162 38, 144 56 C130 68, 112 76, 100 76Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
    <Path d="M100 74 C90 52, 74 18, 68 6 C64 10, 68 32, 78 50 C86 62, 96 72, 100 74Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
    <Path d="M100 74 C110 52, 126 18, 132 6 C136 10, 132 32, 122 50 C114 62, 104 72, 100 74Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
    <Path d="M100 72 C92 48, 86 16, 88 2 C92 -2, 97 10, 100 2 C103 10, 108 -2, 112 2 C114 16, 108 48, 100 72Z" stroke={COLORS.primary} strokeWidth={3} fill="none" />
  </Svg>
);

export interface ClassPDFProps {
  content: string;
  media: PoseMedia[];
  showSanskrit: boolean;
  title: string;
  peakMovement?: string;
  classLength?: number | null;
  yogaStyle?: string | null;
  skillLevel?: string | null;
  inspiration?: string | null;
  imageMap?: Record<string, string>;
  generatedDate?: Date;
}

const ClassPDF = ({
  content,
  media,
  showSanskrit,
  title,
  peakMovement,
  classLength,
  yogaStyle,
  skillLevel,
  inspiration,
  imageMap,
  generatedDate,
}: ClassPDFProps) => {
  const sections: Section[] = parsePlan(content, media);
  const displayName = (name: string) => (showSanskrit ? getSanskritName(name) || name : name);
  const resolvedImage = (url?: string) => (url ? imageMap?.[url] || url : undefined);

  const dateStr = (generatedDate ?? new Date()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const params: { label: string; value: string }[] = [];
  if (peakMovement) params.push({ label: "Peak Focus", value: peakMovement === "None" ? "General Flow" : peakMovement });
  if (classLength) params.push({ label: "Length", value: `${classLength} min` });
  if (skillLevel) params.push({ label: "Skill Level", value: skillLevel });
  if (yogaStyle) params.push({ label: "Style", value: yogaStyle });

  return (
    <Document title={title}>
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.mastheadRow}>
          <Link src={SITE_URL} style={{ textDecoration: "none" }}>
            <View style={styles.logoRow}>
              <LotusLogo />
              <View>
                <Text style={styles.logoText}>Kora</Text>
                <Text style={styles.logoSubtext}>Built for Instructors</Text>
              </View>
            </View>
          </Link>
          <Text style={styles.generatedText}>Generated {dateStr}</Text>
        </View>
        <View style={styles.mastheadRule} />

        <Text style={styles.title}>{title}</Text>
        {params.length > 0 && (
          <View style={styles.paramsRow}>
            {params.map((p) => (
              <View key={p.label} style={styles.paramItem}>
                <Text style={styles.paramLabel}>{p.label}:</Text>
                <Text style={styles.paramValue}>{p.value}</Text>
              </View>
            ))}
          </View>
        )}
        {inspiration && <Text style={styles.inspiration}>Theme: "{inspiration}"</Text>}
        <View style={styles.headerRule} />

        {sections.map((section, si) => {
          const sectionMinutes = section.blocks.reduce((sum, b) => {
            const m = b.duration.match(/(\d+)/);
            return sum + (m ? parseInt(m[1]) : 0);
          }, 0);

          return (
            <View key={si} wrap={false}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {sectionMinutes > 0 && <Text style={styles.sectionMinutes}>{sectionMinutes} MIN</Text>}
              </View>

              {section.blocks.map((block, bi) => {
                let lastSideFlow: string | undefined;
                return (
                  <View key={bi} style={styles.blockWrap}>
                    <View style={styles.blockHeaderRow}>
                      <Text style={styles.blockName}>{block.blockName}</Text>
                      {block.duration && <Text style={styles.blockDuration}>{block.duration}</Text>}
                    </View>

                    {block.poses.map((pose, pi) => {
                      const showSideFlowHeader = pose.sideFlow && pose.sideFlow !== lastSideFlow;
                      lastSideFlow = pose.sideFlow;

                      if (pose.isSideFlowVinyasa) {
                        return (
                          <View key={pi}>
                            {showSideFlowHeader && (
                              <Text style={styles.sideFlowLabel}>
                                {pose.sideFlow === "right" ? "Right Side Flow" : "Left Side Flow"}
                              </Text>
                            )}
                            <View style={styles.transitionBlock}>
                              <Text style={styles.transitionLabel}>
                                Vinyasa: {displayName(pose.sideFlowVinyasaLabel || pose.name)}
                              </Text>
                              {pose.cue && <Text style={styles.transitionDetail}>{pose.cue}</Text>}
                            </View>
                          </View>
                        );
                      }

                      if (pose.isTransition) {
                        return (
                          <View key={pi}>
                            {showSideFlowHeader && (
                              <Text style={styles.sideFlowLabel}>
                                {pose.sideFlow === "right" ? "Right Side Flow" : "Left Side Flow"}
                              </Text>
                            )}
                            <View style={styles.transitionBlock}>
                              <Text style={styles.transitionLabel}>Transition: {displayName(pose.name)}</Text>
                              {pose.breath && <Text style={styles.transitionDetail}>Breath: {pose.breath}</Text>}
                              {pose.cue && <Text style={styles.transitionDetail}>{pose.cue}</Text>}
                            </View>
                          </View>
                        );
                      }

                      const sanskrit = showSanskrit ? getSanskritName(pose.name) : null;
                      const img = resolvedImage(pose.imageUrl);

                      return (
                        <View key={pi}>
                          {showSideFlowHeader && (
                            <Text style={styles.sideFlowLabel}>
                              {pose.sideFlow === "right" ? "Right Side Flow" : "Left Side Flow"}
                            </Text>
                          )}
                          <View style={styles.poseCard} wrap={false}>
                            {img && <Image src={img} style={styles.poseImage} />}
                            <View style={styles.poseTextWrap}>
                              <View style={styles.poseNameRow}>
                                <Text style={styles.poseName}>{displayName(pose.name)}</Text>
                                {sanskrit && (
                                  <Text style={styles.poseSanskrit}>
                                    {" "}({pose.name.replace(/\s*\((Right|Left)\)\s*$/i, "")})
                                  </Text>
                                )}
                                {pose.isSelected && <Text style={styles.selectedBadge}>SELECTED</Text>}
                              </View>
                              {pose.breath && (
                                <Text style={styles.poseDetailRow}>
                                  <Text style={styles.poseDetailLabel}>Breath: </Text>
                                  {pose.breath}
                                </Text>
                              )}
                              {pose.cue && (
                                <Text style={styles.poseDetailRow}>
                                  <Text style={styles.poseDetailLabel}>Cue: </Text>
                                  {pose.cue}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          );
        })}

        <Link src={SITE_URL} style={{ textDecoration: "none" }}>
          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) => `Kora  ·  movewithkora.vercel.app  ·  Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </Link>
      </Page>
    </Document>
  );
};

export default ClassPDF;

/**
 * Renders a ClassPDF to a Blob and triggers a browser download.
 * Prefetches fonts and pose images into memory first — see the comment
 * block above — so the render pass has no in-flight network dependency.
 */
export async function downloadClassPDF(props: Omit<ClassPDFProps, "imageMap" | "generatedDate">) {
  const sections = parsePlan(props.content, props.media);
  const imageUrls = sections.flatMap((s) => s.blocks.flatMap((b) => b.poses.map((p) => p.imageUrl).filter(Boolean) as string[]));

  const [, imageMap] = await Promise.all([ensureFontsLoaded(), preloadImages(imageUrls)]);

  const generatedDate = new Date();
  const blob = await pdf(<ClassPDF {...props} imageMap={imageMap} generatedDate={generatedDate} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTitle = (props.title || "yoga-class").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  a.download = `${safeTitle || "kora-class"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
