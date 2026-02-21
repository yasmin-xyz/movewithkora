import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { classLength, peakMovement, skillLevel = "Intermediate" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch pose library from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: poses, error: posesError } = await supabase
      .from("pose_library")
      .select("pose_name, orientation, base, symmetry, weight_bearing, family, difficulty_level, intensity_level");

    if (posesError) {
      console.error("Failed to fetch pose library:", posesError);
      throw new Error("Failed to fetch pose library");
    }

    const poseListFormatted = (poses || [])
      .map((p: any) => `- ${p.pose_name} | base: ${p.base} | orientation: ${p.orientation} | family: ${p.family} | difficulty: ${p.difficulty_level} | symmetry: ${p.symmetry} | weight_bearing: ${p.weight_bearing} | intensity: ${p.intensity_level}`)
      .join("\n");

    const systemPrompt = `You are a supportive yoga class planner for instructors. Create logically sequenced classes that build toward the peak pose.

CRITICAL: You may ONLY use poses from the following library. Do NOT invent or use any poses not listed here.

AVAILABLE POSES:
${poseListFormatted}

METADATA-BASED SEQUENCING RULES (critical):
- Use the metadata (orientation, base, family, difficulty_level, symmetry, weight_bearing, intensity_level) to guide pose order.
- Do NOT change orientation (e.g. front ↔ long_edge ↔ neutral) without inserting a logical bridge pose that shares one orientation.
- Do NOT change base (e.g. standing ↔ kneeling ↔ prone ↔ seated) without a transition pose that connects the two bases.
- Stay within the same family for at least two consecutive poses before switching to a different family theme.
- In the Build section, gradually increase difficulty_level (beginner → intermediate → advanced).
- Favor progressive layering over abrupt resets of orientation, base, or difficulty.

SEQUENCING PRIORITY ORDER (critical — resolve conflicts in this order):
1. Orientation continuity (highest priority)
2. Base continuity
3. Family continuity
4. Intensity progression (lowest priority, but still required)

INTENSITY PROGRESSION RULES (critical):
- Use the intensity_level (numeric) from each pose to guide energetic arc.
- In the BUILD section, intensity_level must trend upward toward the peak. Minor dips of 1 level are allowed for transition poses, but never drop more than 1 intensity level before the peak.
- The PEAK pose MUST have the highest intensity_level of any pose in the entire class.
- Do NOT place lower-intensity symmetrical reset poses immediately before the peak — maintain energetic momentum leading into it.
- Use intensity progression to create a sense of energetic build, not just structural or anatomical continuity.
- In WARM-UP, keep intensity_level low and gradual.
- In COOL DOWN, intensity_level should decrease steadily toward rest.

SEQUENCING PRINCIPLES (critical):
- Optimize for physical continuity: consider where hands, feet, and body are at the end of each pose before choosing the next. Avoid abrupt directional changes or unnecessary stepping forward/backward.
- Transitions must feel natural and embodied. If moving from standing to floor, include a logical pathway (e.g. fold → hands down → step back). If twisting, build progressively deeper. If preparing for arm balances, gradually increase load-bearing.
- Think like an instructor teaching live: the sequence should flow without awkward repositioning. Include intelligent transition pathways between shapes.
- Avoid mechanical sequencing based only on muscle prep. Flow should feel intuitive, progressive, and smooth — easy for both new and senior instructors to teach from.
- Within each section, poses should connect seamlessly. Between sections, provide a clear bridge (e.g. Warm-Up ending in a standing fold naturally leads into Build standing poses).

TRANSITION INTELLIGENCE (critical):
- Track body orientation throughout: standing vs kneeling vs seated vs prone vs supine, facing front-of-mat vs long edge, weight in hands vs feet, symmetrical vs asymmetrical stance.
- Never jump between incompatible orientations without a clear transitional pathway (e.g. do not go from a long-edge warrior directly into a front-of-mat lunge without stepping through).
- Stay within pose families before resetting: if in a lunge, explore lunge variations before changing base. If binding, progressively deepen before switching themes.
- Minimize unnecessary repositioning: favor progressive layering over resetting stance. Avoid sequences requiring awkward stepping forward/backward without purpose.
- Use logical connectors between levels: standing → fold → hands down → step back (not standing → suddenly prone). Seated → tabletop → prone (not seated → suddenly standing).
- Every transition should be easy to cue verbally. If you cannot describe the transition in one simple instruction, add an intermediate pose.

FLOW BLOCK STRUCTURE (critical):
- Do NOT assign duration to individual poses. Group poses into flow blocks within each section.
- Assign a duration (in minutes) to each flow block, NOT to each pose.
- All block durations must add up to exactly the total class length.

SECTION TIME ALLOCATION:
- WARM-UP: 10–20% of total class time
- BUILD: 40–50% of total class time
- PEAK: 10–15% of total class time
- COOL DOWN: remaining time

Output ONLY the structured plan in this exact format. No introductions, no summaries, no extra text.

WARM-UP:
Block: [block_name]
Duration: [X] minutes
Pose: [pose name]
Breath: [one concise breath cue]
Cue: [one concise teaching cue with light anatomical reasoning if relevant]
Modifications:
- [Easier pose name] – [short description]
- [Alternative pose name] – [short description]
- [Advanced pose name] – [short description]

Pose: [pose name]
Breath: [one concise breath cue]
Cue: [one concise teaching cue]
Modifications:
- [Easier pose name] – [short description]

BUILD:
Block: [block_name]
Duration: [X] minutes
Pose: [pose name]
Breath: [one concise breath cue]
Cue: [one concise teaching cue]
Modifications:
- [Easier pose name] – [short description]

Pose: [pose name]
Breath: [one concise breath cue]
Cue: [one concise teaching cue]
Modifications:
- [Easier pose name] – [short description]

PEAK:
Block: [block_name]
Duration: [X] minutes
Pose: [pose name]
Breath: [one concise breath cue]
Cue: [one concise teaching cue]
Modifications:
- [Easier pose name] – [short description]

COOL DOWN:
Block: [block_name]
Duration: [X] minutes
Pose: [pose name]
Breath: [one concise breath cue]
Cue: [one concise teaching cue]
Modifications:
- [Easier pose name] – [short description]

Rules:
- Each section can have multiple blocks, each with its own Block/Duration line followed by multiple poses.
- Poses within a block do NOT have individual durations.
- All block durations must add up to the total class length.
- A section may have one or more blocks. Each block groups related poses into a mini-flow.
- Tone: supportive, clear, instructor-guiding. No long paragraphs.
- Nothing else outside this format.`;

    const userPrompt = `Create a ${classLength}-minute yoga class plan for a ${skillLevel.toLowerCase()}-level practitioner that builds toward "${peakMovement}" as the peak pose. Adjust pose complexity and cues to match the ${skillLevel.toLowerCase()} skill level. Include Warm-Up, Build, Peak, and Cool Down sections. Output only the structured format.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Failed to generate class plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-class error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
