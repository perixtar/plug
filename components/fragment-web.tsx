"use client";

import { checkDeploymentStatus } from "@/app/actions/vercel/deploy";
import { useToolMessageStore } from "@/app/store/tool-message-store";
import { useToolViewStore } from "@/app/store/tool-view-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { previewUrl } from "@/lib/preview";
import { GetDeploymentResponseBodyStatus } from "@vercel/sdk/models/getdeploymentop.js";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const loadingMessages = [
  "Analyzing prompt…",
  "Composing code snippet…",
  "Optimizing output…",
  "Finishing touches…",
  "Provisioning sandbox…",
  "Uploading your code…",
  "Booting up environment…",
];

type Panel = "error" | "logs";

export function CodeArtifactWebview() {
  const [iframeKey] = useState(0);
  const [persistentDeploymentUrl, setPersistentDeploymentUrl] = useState("");
  const currentNavPage = useToolViewStore((s) => s.currentNavPage || "");
  const deploymentResult = useToolViewStore((s) => s.deploymentResult);

  const { enqueueDebugRequest } = useToolMessageStore();
  const lastMsg = useToolMessageStore((s) => s.lastMessage);

  const [msgIndex, setMsgIndex] = useState(0);
  const [errors, setErrors] = useState<Set<string>>(() =>
    lastMsg?.runtimeError ? new Set<string>([lastMsg.runtimeError]) : new Set()
  );

  const [panel, setPanel] = useState<Panel>("error");
  const [logs, setLogs] = useState<string>("");
  const joinedErrors = useMemo(() => {
    if (errors.size === 0) return "";
    return [...errors].join("\n");
  }, [errors]);

  const doHandleFix = () => {
    if (errors.size > 0) {
      // Queue a single request containing all unique errors
      enqueueDebugRequest(joinedErrors);
    }
    // close overlay afterwards
    setPanel("error");
    setErrors(new Set()); // clear collected errors
    setLogs("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i < loadingMessages.length - 1 ? i + 1 : i));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Receive runtime errors from iframe (cross-origin safe message)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "iframe-error") {
        const iframeError = event.data.message as string;
        console.log("❌ iframe runtime error:", iframeError);
        setErrors((prev) => {
          const next = new Set(prev);
          next.add(iframeError);
          return next;
        });
        setPanel("error");
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Periodically check if the Vercel deployment is ready
  useEffect(() => {
    async function checkVercelDeploymentReadiness() {
      if (!deploymentResult) return;
      const status = await checkDeploymentStatus(
        deploymentResult.vercelDeploymentId
      );
      if (status === GetDeploymentResponseBodyStatus.Ready) {
        setPersistentDeploymentUrl(deploymentResult.vercelPreviewUrl);
      }
    }
    checkVercelDeploymentReadiness();
  }, [deploymentResult]);

  // Show overlay if there is an error OR we're currently on the logs panel
  const showOverlay = useMemo(
    () => panel === "logs" || errors.size > 0,
    [panel, errors]
  );

  function extractLogs(): string {
    return joinedErrors || "No logs available.";
  }

  return (
    <div className="flex flex-col w-full h-full">
      {deploymentResult ? (
        <div className="relative h-full w-full">
          <iframe
            key={iframeKey}
            className="h-full w-full rounded-md border"
            sandbox="allow-forms allow-scripts allow-same-origin"
            loading="lazy"
            src={
              persistentDeploymentUrl
                ? previewUrl(persistentDeploymentUrl, currentNavPage)
                : previewUrl(deploymentResult.sbxUrl, currentNavPage)
            }
          />

          {showOverlay && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <Card className="w-[680px] shadow-lg">
                <CardContent className="p-6">
                  {panel === "error" ? (
                    // ---------- Error panel ----------
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="mt-1 h-6 w-6 text-amber-500" />
                      <div className="flex-1">
                        <div className="text-xl font-semibold">Error</div>
                        <p className="mt-1 text-muted-foreground">
                          The app encountered an error
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setLogs(extractLogs());
                            setPanel("logs");
                          }}
                        >
                          Show logs
                        </Button>
                        <Button onClick={doHandleFix}>Try to fix</Button>
                      </div>
                    </div>
                  ) : (
                    // ---------- Logs panel ----------
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-semibold">Logs</div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={doHandleFix}>
                            Try to fix
                          </Button>
                          <Button
                            onClick={() => {
                              setPanel("error");
                            }}
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                      <pre className="max-h-96 overflow-y-auto rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {logs}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <span className="text-lg font-semibold text-gray-700">
            {loadingMessages[msgIndex]}
          </span>
        </div>
      )}
    </div>
  );
}
