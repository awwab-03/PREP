import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const DIFFICULTIES = [
  { id: "beginner", label: "Beginner", desc: "Fundamentals & basics" },
  { id: "intermediate", label: "Intermediate", desc: "Practical depth" },
  { id: "advanced", label: "Advanced", desc: "Senior-level rigor" },
];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionCount, setQuestionCount] = useState(6);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill JD from the last ATS analysis if present.
  useEffect(() => {
    api
      .get("/api/ats/latest")
      .then((res) => setJd(res.data.atsResults?.jobDescription || ""))
      .catch(() => {});
  }, []);

  const start = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/interview/start", {
        role,
        difficulty,
        questionCount,
        jobDescription: jd || undefined,
      });
      navigate(`/interview/${res.data.interview._id}`);
    } catch (err) {
      setError(apiError(err));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Set up your mock interview</h1>
      <p className="mb-8 text-muted-foreground">
        We'll generate questions grounded in your actual resume.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" /> Interview settings
          </CardTitle>
          <CardDescription>
            Questions reference your real projects, skills and technologies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role">Target role</Label>
            <Input
              id="role"
              placeholder="e.g. Backend Engineer, Full-Stack Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    difficulty === d.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Number of questions: {questionCount}</Label>
            <input
              id="count"
              type="range"
              min="3"
              max="10"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jd">Job description (optional)</Label>
            <Textarea
              id="jd"
              className="min-h-[100px]"
              placeholder="Paste a job description to tailor questions to the role..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </p>
          )}

          <Button className="w-full" size="lg" onClick={start} disabled={loading}>
            {loading ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating questions..." : "Start interview"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
