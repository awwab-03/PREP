import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    api
      .get("/api/resume")
      .then((res) => setResume(res.data.resume))
      .catch(() => {});
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.append("resume", file);
    try {
      const res = await api.post("/api/resume/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(res.data.resume);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const submitPaste = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/resume/paste", { resumeText: pasteText });
      setResume(res.data.resume);
      setPasteText("");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your Resume</h1>
      <p className="mb-8 text-muted-foreground">
        Upload a PDF or DOCX. We extract the text and detect your skills.
      </p>

      {/* Dropzone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => uploadFile(e.target.files?.[0])}
            />
            {loading ? (
              <Spinner className="h-7 w-7 text-primary" />
            ) : (
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="mt-3 font-medium">
              {loading ? "Processing..." : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">PDF or DOCX · max 5 MB</p>
          </div>

          {error && (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paste fallback */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Or paste resume text</CardTitle>
          <CardDescription>
            No file handy? Paste your resume content directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste your full resume text here..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={loading || pasteText.trim().length < 30}
            onClick={submitPaste}
          >
            {loading && <Spinner />} Save pasted resume
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {resume && (
        <Card className="mt-5 animate-fade-in border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Resume ready
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> {resume.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm font-medium">
              Detected skills ({resume.skills?.length || 0})
            </p>
            <div className="flex flex-wrap gap-2">
              {resume.skills?.length ? (
                resume.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="capitalize">
                    {s}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No known skills detected — your resume text was still saved.
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => navigate("/ats")}>
                Run ATS analysis <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/interview/setup")}>
                Start interview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
