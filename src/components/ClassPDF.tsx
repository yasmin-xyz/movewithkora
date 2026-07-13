import { Document, Page, View, Text, Image, StyleSheet, Font, pdf } from "@react-pdf/renderer";
import { parsePlan, type PoseMedia, type Section } from "@/lib/parseClassPlan";
import { getSanskritName } from "@/lib/sanskritNames";

// Kora's palette, converted from the HSL tokens in index.css to literal hex —
// @react-pdf/renderer renders outside the DOM, so it can't read CSS variables.
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

// Font files served from jsDelivr's fontsource CDN — chosen because it sends
// CORS headers that allow @react-pdf/renderer to fetch them from the browser
// (fonts.gstatic.com's css2 endpoint does not reliably support this).
// If these paths ever 404 (fontsource occasionally reshuffles versions), the
// more durable fix is to download the .ttf files into /public/fonts and
// register local paths instead — swap the src values below for e.g.
// "/fonts/cormorant-garamond-600.ttf".
Font.register({
  family: "Cormorant Garamond",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-700-normal.ttf", fontWeight: 700 },
  ],
});
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf", fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]); // avoid mid-word breaks

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    color: COLORS.foreground,
    fontFamily: "Inter",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 44,
  },
  title: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 600,
    fontSize: 26,
    color: COLORS.foreground,
  },
  metaLine: {
    fontFamily: "Inter",
    fontSize: 9,
    color: COLORS.mutedForeground,
    marginTop: 4,
  },
  inspiration: {
    fontFamily: "Inter",
    fontSize: 9,
    fontStyle: "italic",
    color: COLORS.mutedForeground,
    marginTop: 4,
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
    opacity: 1,
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
  poseDetailRow: {
    flexDirection: "row",
    fontSize: 9,
    color: COLORS.mutedForeground,
    marginTop: 1,
  },
  poseDetailLabel: {
    fontFamily: "Inter",
    fontWeight: 500,
    color: "#5C6B55",
  },
  altsLine: {
    fontSize: 7.5,
    color: COLORS.mutedForeground,
    marginTop: 3,
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

export interface ClassPDFProps {
  content: string;
  media: PoseMedia[];
  showSanskrit: boolean;
  title: string;
  classLength?: number | null;
  yogaStyle?: string | null;
  inspiration?: string | null;
}

const ClassPDF = ({ content, media, showSanskrit, title, classLength, yogaStyle, inspiration }: ClassPDFProps) => {
  const sections: Section[] = parsePlan(content, media);
  const displayName = (name: string) => (showSanskrit ? getSanskritName(name) || name : name);

  const metaParts = [
    classLength ? `${classLength} min` : null,
    yogaStyle || null,
  ].filter(Boolean);

  return (
    <Document title={title}>
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.title}>{title}</Text>
        {metaParts.length > 0 && <Text style={styles.metaLine}>{metaParts.join("  ·  ")}</Text>}
        {inspiration && <Text style={styles.inspiration}>"{inspiration}"</Text>}
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

                      return (
                        <View key={pi}>
                          {showSideFlowHeader && (
                            <Text style={styles.sideFlowLabel}>
                              {pose.sideFlow === "right" ? "Right Side Flow" : "Left Side Flow"}
                            </Text>
                          )}
                          <View style={styles.poseCard} wrap={false}>
                            {pose.imageUrl && <Image src={pose.imageUrl} style={styles.poseImage} />}
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

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Kora  ·  Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

export default ClassPDF;

/**
 * Renders a ClassPDF to a Blob and triggers a browser download.
 * Pure client-side — no server round trip.
 */
export async function downloadClassPDF(props: ClassPDFProps) {
  const blob = await pdf(<ClassPDF {...props} />).toBlob();
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
