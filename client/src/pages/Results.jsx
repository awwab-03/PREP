import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trophy, Brain, MessageSquare, Target, ArrowLeft } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ScoreRing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { scoreColor } from "@/lib/utils";

export default function Results() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/interview/${id}`)
      .then((res) => setInterview(res.data.interview))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner label="Loading results..." />;
  if (!interview)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-rose-400">
        {error || "Interview not found"}
      </div>
    );

  const subScores = [
    { icon: Brain, label: "Technical", value: interview.technicalScore },
    { icon: MessageSquare, label: "Communication", value: interview.communicationScore },
    { icon: Target, label: "Questions", value: interview.turns.length, raw: true },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-2 flex items-center gap-3">
        <Trophy className="h-7 w-7 text-amber-400" />
        <h1 className="text-3xl font-bold">Interview Results</h1>
      </div>
      <p className="mb-8 text-muted-foreground">
        {interview.role} · <span className="capitalize">{interview.difficulty}</span> ·{" "}
        {new Date(interview.createdAt).toLocaleDateString()}
      </p>

      {/* Overall + sub-scores */}
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <Card className="flex items-center justify-center p-6">
          <ScoreRing score={interview.overallScore || 0} label="Overall" />
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {subScores.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <s.icon className="mb-2 h-6 w-6 text-primary" />
                <span
                  className={`text-3xl font-bold ${
                    s.raw ? "" : scoreColor(s.value || 0)
                  }`}
                >
                  {s.value ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Improvement areas */}
      {interview.improvementAreas?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Improvement Areas</CardTitle>
            <CardDescription>Focus on these before your next round.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {interview.improvementAreas.map((a, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-md bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="text-primary">→</span> {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Per-question review */}
      <h2 className="mb-4 mt-10 text-xl font-semibold">Question Review</h2>
      <div className="space-y-4">
        {interview.turns.map((turn, i) => (
          <Card key={turn._id || i}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-medium">
                  Q{i + 1}. {turn.question}
                </CardTitle>
                {turn.evaluation && (
                  <span
                    className={`shrink-0 text-lg font-bold ${scoreColor(
                      turn.evaluation.score
                    )}`}
                  >
                    {turn.evaluation.score}
                  </span>
                )}
              </div>
              <Badge variant="outline" className="w-fit capitalize">
                {turn.questionType}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Your answer
                </p>
                <p className="rounded-md bg-secondary/40 px-3 py-2 whitespace-pre-wrap">
                  {turn.answer || <span className="text-muted-foreground">No answer</span>}
                </p>
              </div>
              {turn.evaluation?.feedback && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Feedback
                  </p>
                  <p className="text-muted-foreground">{turn.evaluation.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex justify-center gap-3">
        <Link to="/interview/setup">
          <Button>Run another interview</Button>
        </Link>
        <Link to="/ats">
          <Button variant="outline">Back to ATS analysis</Button>
        </Link>
      </div>
    </div>
  );
}
