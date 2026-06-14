import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, User, Send, Flag, CheckCircle2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { PageSpinner, Spinner } from "@/components/ui/spinner";
import { scoreColor } from "@/lib/utils";

export default function MockInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get(`/api/interview/${id}`)
      .then((res) => {
        if (res.data.interview.status === "completed") {
          navigate(`/interview/${id}/results`, { replace: true });
          return;
        }
        setInterview(res.data.interview);
      })
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // The index of the first unanswered question.
  const turns = interview?.turns || [];
  const currentIndex = turns.findIndex((t) => !t.evaluation);
  const current = currentIndex >= 0 ? turns[currentIndex] : null;
  const answeredCount = turns.filter((t) => t.evaluation).length;
  const allAnswered = currentIndex === -1 && turns.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answeredCount, current]);

  const submit = async () => {
    if (!current || !answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post(`/api/interview/${id}/answer`, {
        turnId: current._id,
        answer,
      });
      // Update the local turn with the returned evaluation.
      setInterview((prev) => {
        const updated = { ...prev, turns: prev.turns.map((t) => ({ ...t })) };
        updated.turns[currentIndex].answer = answer;
        updated.turns[currentIndex].evaluation = res.data.evaluation;
        return updated;
      });
      setAnswer("");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await api.post(`/api/interview/${id}/complete`);
      navigate(`/interview/${id}/results`);
    } catch (err) {
      setError(apiError(err));
      setFinishing(false);
    }
  };

  if (loading) return <PageSpinner label="Loading interview..." />;
  if (!interview)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-rose-400">
        {error || "Interview not found"}
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">{interview.role}</h1>
          <Badge variant="outline" className="capitalize">
            {interview.difficulty}
          </Badge>
        </div>
        <Progress value={(answeredCount / turns.length) * 100} />
        <p className="mt-1 text-xs text-muted-foreground">
          {answeredCount} of {turns.length} answered
        </p>
      </div>

      {/* Transcript */}
      <div className="space-y-5 scroll-thin">
        {turns.map((turn, i) => {
          // Only render up to and including the current question.
          if (i > currentIndex && currentIndex !== -1) return null;
          return (
            <div key={turn._id || i} className="space-y-3">
              <Bubble role="bot" type={turn.questionType}>
                {turn.question}
              </Bubble>

              {turn.answer && (
                <Bubble role="user">{turn.answer}</Bubble>
              )}

              {turn.evaluation && (
                <EvaluationCard evaluation={turn.evaluation} />
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-rose-400">
          {error}
        </p>
      )}

      {/* Answer box / finish */}
      {!allAnswered ? (
        <div className="sticky bottom-4 mt-6">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Textarea
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ⌘/Ctrl + Enter to send
                </span>
                <Button onClick={submit} disabled={submitting || !answer.trim()}>
                  {submitting ? <Spinner /> : <Send className="h-4 w-4" />}
                  Submit answer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" /> All questions answered
          </div>
          <div>
            <Button size="lg" onClick={finish} disabled={finishing}>
              {finishing ? <Spinner /> : <Flag className="h-4 w-4" />}
              Finish & view results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ role, type, children }) {
  const isBot = role === "bot";
  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isBot ? "bg-primary/15 text-primary" : "bg-secondary"
        }`}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
          isBot
            ? "rounded-tl-none bg-card border border-border"
            : "rounded-tr-none bg-primary text-primary-foreground"
        }`}
      >
        {isBot && type && (
          <Badge variant="outline" className="mb-2 capitalize">
            {type}
          </Badge>
        )}
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  );
}

function EvaluationCard({ evaluation }) {
  return (
    <div className="ml-11 rounded-lg border border-border bg-secondary/40 p-4 text-sm animate-fade-in">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium">Feedback</span>
        <span className={`font-bold ${scoreColor(evaluation.score)}`}>
          {evaluation.score}/100
        </span>
      </div>
      <p className="mb-3 text-muted-foreground">{evaluation.feedback}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.strengths?.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-emerald-400">Strengths</p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
              {evaluation.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.suggestions?.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-primary">Suggestions</p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
              {evaluation.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
