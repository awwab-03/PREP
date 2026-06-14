import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, XCircle, Lightbulb, ArrowRight } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ScoreRing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const BREAKDOWN_LABELS = {
  skillMatch: { label: "Technical Skill Match", weight: "55%" },
  keywordMatch: { label: "Keyword Match", weight: "20%" },
  softSkillMatch: { label: "Soft Skill Match", weight: "5%" },
  projectMatch: { label: "Project Match", weight: "10%" },
  educationMatch: { label: "Education Match", weight: "10%" },
};

export default function ATSResults() {
  const navigate = useNavigate();
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the most recent saved analysis (if any) for convenience.
  useEffect(() => {
    api
      .get("/api/ats/latest")
      .then((res) => {
        const r = res.data.atsResults;
        setResult({
          score: r.score,
          breakdown: r.breakdown,
          matchedKeywords: r.matchedKeywords,
          missingKeywords: r.missingKeywords,
          missingSkills: r.missingSkills,
          ai: { recommendations: r.recommendations || [], keywordRecommendations: [], strengths: [], summary: "" },
        });
        setJd(r.jobDescription || "");
      })
      .catch(() => {});
  }, []);

  const analyze = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/ats/analyze", { jobDescription: jd });
      setResult(res.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">ATS Analysis</h1>
      <p className="mb-8 text-muted-foreground">
        Paste a job description. We score your resume against it in code — fully
        transparent and explainable.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Description</CardTitle>
          <CardDescription>
            Paste the full posting for the most accurate match.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[180px]"
            placeholder="Paste the job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </p>
          )}
          <Button onClick={analyze} disabled={loading || jd.trim().length < 30}>
            {loading ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            Analyze resume
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-8 space-y-6 animate-fade-in">
          {/* Score + breakdown */}
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <Card className="flex items-center justify-center p-6">
              <ScoreRing score={result.score} />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score Breakdown</CardTitle>
                <CardDescription>
                  Weighted sum computed deterministically in the backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(BREAKDOWN_LABELS).map(([key, meta]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>
                        {meta.label}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({meta.weight})
                        </span>
                      </span>
                      <span className="font-medium">
                        {result.breakdown[key] ?? 0}%
                      </span>
                    </div>
                    <Progress value={result.breakdown[key] ?? 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          <div className="grid gap-6 md:grid-cols-2">
            <SkillList
              title="Missing Skills"
              icon={XCircle}
              tone="destructive"
              items={result.missingSkills}
              empty="No skill gaps — great match!"
            />
            <SkillList
              title="Missing Keywords"
              icon={XCircle}
              tone="warning"
              items={result.missingKeywords}
              empty="All key terms covered!"
            />
          </div>

          {result.matchedSkills?.length > 0 && (
            <SkillList
              title="Matched Skills"
              icon={CheckCircle2}
              tone="success"
              items={result.matchedSkills}
            />
          )}

          {/* AI recommendations */}
          {(result.ai?.recommendations?.length > 0 ||
            result.ai?.keywordRecommendations?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-primary" /> AI Suggestions
                </CardTitle>
                {result.ai.summary && (
                  <CardDescription>{result.ai.summary}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {result.ai.recommendations?.length > 0 && (
                  <ul className="space-y-2">
                    {result.ai.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
                {result.ai.keywordRecommendations?.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Add these keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.ai.keywordRecommendations.map((k) => (
                        <Badge key={k} variant="default">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => navigate("/interview/setup")}>
              Practice these gaps in an interview{" "}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillList({ title, icon: Icon, tone, items, empty }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={`h-5 w-5 ${
              tone === "success"
                ? "text-emerald-400"
                : tone === "warning"
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          />
          {title} ({items?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items?.length ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge key={item} variant={tone} className="capitalize">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
