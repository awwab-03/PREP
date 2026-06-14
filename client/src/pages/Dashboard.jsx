import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Target,
  MessageSquare,
  Upload,
  ArrowRight,
  Clock,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { scoreColor } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/resume").catch(() => null),
      api.get("/api/interview").catch(() => ({ data: { interviews: [] } })),
    ]).then(([r, i]) => {
      setResume(r?.data?.resume || null);
      setInterviews(i?.data?.interviews || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageSpinner label="Loading your dashboard..." />;

  const hasResume = !!resume;
  const ats = resume?.atsResults;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Here's your interview-prep workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resume
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasResume ? "Uploaded" : "Not yet"}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {hasResume ? resume.fileName : "Upload to get started"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest ATS Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ats ? scoreColor(ats.score) : ""}`}>
              {ats ? `${ats.score}/100` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {ats ? "Resume vs. job description" : "Run an ATS analysis"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interviews
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
            <p className="text-xs text-muted-foreground">
              {interviews.filter((i) => i.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action cards */}
      <div className="mb-10 grid gap-5 md:grid-cols-3">
        <ActionCard
          to="/resume"
          icon={Upload}
          title="Upload Resume"
          desc="Add or update your resume (PDF / DOCX)."
        />
        <ActionCard
          to="/ats"
          icon={Target}
          title="ATS Analysis"
          desc="Paste a job description and score your resume."
          disabled={!hasResume}
          disabledHint="Upload a resume first"
        />
        <ActionCard
          to="/interview/setup"
          icon={MessageSquare}
          title="Mock Interview"
          desc="Run a personalized, resume-aware AI interview."
          disabled={!hasResume}
          disabledHint="Upload a resume first"
        />
      </div>

      {/* Interview history */}
      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
          <CardDescription>Your previous mock interview sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No interviews yet. Run your first mock interview to see results here.
            </p>
          ) : (
            <div className="space-y-2">
              {interviews.map((i) => (
                <Link
                  key={i.id}
                  to={
                    i.status === "completed"
                      ? `/interview/${i.id}/results`
                      : `/interview/${i.id}`
                  }
                  className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.role}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(i.createdAt).toLocaleDateString()} ·{" "}
                      {i.questionCount} questions
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {i.difficulty}
                  </Badge>
                  {i.status === "completed" ? (
                    <span className={`text-lg font-bold ${scoreColor(i.overallScore)}`}>
                      {i.overallScore}
                    </span>
                  ) : (
                    <Badge variant="warning">In progress</Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, desc, disabled, disabledHint }) {
  const inner = (
    <Card
      className={`h-full transition-all ${
        disabled
          ? "opacity-50"
          : "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
      }`}
    >
      <CardContent className="pt-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {disabled ? disabledHint : desc}
        </p>
      </CardContent>
    </Card>
  );

  if (disabled) return <div>{inner}</div>;
  return <Link to={to}>{inner}</Link>;
}
