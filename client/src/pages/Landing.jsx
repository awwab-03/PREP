import { Link } from "react-router-dom";
import {
  FileText,
  Target,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    icon: FileText,
    title: "Resume Parsing",
    desc: "Upload a PDF or DOCX. We extract the text and detect your skills automatically.",
  },
  {
    icon: Target,
    title: "Deterministic ATS Score",
    desc: "A transparent, code-calculated score across keywords, skills, projects and education — not a black box.",
  },
  {
    icon: Sparkles,
    title: "AI Suggestions",
    desc: "Get missing skills, missing keywords and concrete resume improvements tailored to the job.",
  },
  {
    icon: MessageSquare,
    title: "Resume-Aware Interviews",
    desc: "Mock interviews that ask about YOUR projects and tech — then score every answer with feedback.",
  },
];

const steps = [
  "Upload your resume",
  "Paste a job description",
  "Get your ATS score & gaps",
  "Run a personalized mock interview",
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/register";

  return (
    <div className="glow-bg">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-powered interview preparation
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Land the interview.
          <br />
          <span className="gradient-text">Then ace it.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          PrepAI scores your resume against any job like a real ATS, shows you
          exactly what's missing, and runs AI mock interviews built around your
          own projects and experience.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={cta}>
            <Button size="lg">
              Start preparing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              I have an account
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-4 pb-24">
        <h2 className="mb-8 text-center text-2xl font-semibold">
          How it works
        </h2>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="font-medium">{s}</span>
              <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-400" />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to={cta}>
            <Button size="lg">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        PrepAI — built with React, Node.js, MongoDB & OpenAI.
      </footer>
    </div>
  );
}
