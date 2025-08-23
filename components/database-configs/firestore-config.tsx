"use client";

import { checkNicknameDup } from "./database-config-lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { workspace_database } from "@/lib/generated/prisma";
import { CheckCircle2, XCircle, Loader2, Database, Key } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface FirestoreConfigProps {
  onConnectionTested: (
    success: boolean,
    config: FirestoreConfigInterface
  ) => void;
  existingDatabases: workspace_database[] | [];
}

export interface FirestoreConfigInterface {
  nickname: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL: string;
}

export function FirestoreConfig({
  onConnectionTested,
  existingDatabases,
}: FirestoreConfigProps) {
  const [formData, setFormData] = useState<FirestoreConfigInterface>({
    nickname: "",
    projectId: "",
    clientEmail: "",
    privateKey: "",
    databaseURL: "",
  });

  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [connectionError, setConnectionError] = useState("");
  const [collections, setCollections] = useState<string[]>([]);
  const [isFirestoreHelpOpen, setFirestoreHelpOpen] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Reset connection status when configuration changes
    if (connectionStatus !== "idle") {
      setConnectionStatus("idle");
      setCollections([]);
      // reset to false so user needs to test connection again
      onConnectionTested(false, formData);
    }
  };

  const sanitizeForm = (
    d: FirestoreConfigInterface
  ): FirestoreConfigInterface => ({
    nickname: d.nickname.trim(),
    projectId: d.projectId.trim(),
    clientEmail: d.clientEmail.trim(),
    privateKey: d.privateKey.trim(),
    databaseURL: d.databaseURL.trim(),
  });

  const testConnection = async () => {
    const clean = sanitizeForm(formData);

    if (
      !clean.nickname ||
      !clean.projectId ||
      !clean.clientEmail ||
      !clean.privateKey
    ) {
      setConnectionStatus("error");
      setConnectionError(
        "Please fill all required fields (spaces only were removed)."
      );
      onConnectionTested(false, clean);
      return;
    }

    // use trimmed nickname for dup check
    if (!checkNicknameDup(existingDatabases, clean.nickname)) {
      return;
    }

    setConnectionStatus("testing");
    setConnectionError("");
    setCollections([]);

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType: "firestore",
          config: clean,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();

      if (result.success) {
        setConnectionStatus("success");
        if (result.collections) setCollections(result.collections);
        onConnectionTested(true, clean); // report trimmed values
      } else {
        setConnectionStatus("error");
        setConnectionError(result.message);
        onConnectionTested(false, clean);
      }
    } catch (error: any) {
      console.error("Error testing connection:", error);
      setConnectionStatus("error");
      setConnectionError(`Connection test failed: ${error.message}`);
      onConnectionTested(false, clean);
    }
  };

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case "testing":
        return (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing connection...</span>
          </div>
        );
      case "success":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Connection successful!</span>
            </div>

            {collections.length > 0 && (
              <div className="mt-4 p-4 border rounded-md bg-muted/30">
                <div className="flex items-center gap-2 mb-2 font-medium">
                  <Database className="h-4 w-4" />
                  <span>Found {collections.length} collections:</span>
                </div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {collections.map((collection) => (
                    <li key={collection}>{collection}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "error":
        return (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionError ||
                "Failed to connect to database. Please check your credentials."}
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const isValid = () => {
    return Boolean(
      formData.nickname &&
        formData.projectId &&
        formData.clientEmail &&
        formData.privateKey
    );
  };

  return (
    <div className="space-y-6 mt-8 border-t pt-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Firebase Admin Configuration</h3>
        <p className="text-sm text-muted-foreground flex items-baseline gap-2">
          <span>
            Enter your Firebase service account details to connect as an admin.
          </span>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto text-muted-foreground"
            onClick={() => setFirestoreHelpOpen(true)}
          >
            ( Where do I find my Firestore credentials? )
          </Button>
        </p>
      </div>
      <Dialog open={isFirestoreHelpOpen} onOpenChange={setFirestoreHelpOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Find your Firestore credentials</DialogTitle>
            <DialogDescription>
              Download a Service Account JSON and paste its values here.
            </DialogDescription>
          </DialogHeader>

          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              Open the <span className="font-medium">Firebase Console</span> and
              select your project.
            </li>
            <li>
              Click the{" "}
              <span className="font-medium">gear icon → Project settings</span>.
            </li>
            <li>
              Go to the <span className="font-medium">Service accounts</span>{" "}
              tab.
            </li>
            <li>
              Under <span className="font-medium">Firebase Admin SDK</span>,
              click
              <span className="font-medium">
                {" "}
                “Generate new private key”
              </span>{" "}
              to download the JSON.
            </li>
            <li>
              In this form, use values from that JSON (e.g.{" "}
              <code>project_id</code>,<code> client_email</code>,{" "}
              <code> private_key</code>).
            </li>
          </ol>

          <div className="text-xs text-muted-foreground mt-4">
            Tip: Alternatively, use Google Cloud → IAM &amp; Admin → Service
            Accounts → your account → <em>Keys</em> → Add key → Create new key
            (JSON).
          </div>

          <DialogFooter>
            <Button onClick={() => setFirestoreHelpOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Database Nickname </Label>
            <Input
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="your-custom-project-nickname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="databaseURL">Database URL (Optional)</Label>
            <Input
              id="databaseURL"
              name="databaseURL"
              value={formData.databaseURL}
              onChange={handleInputChange}
              placeholder="https://your-project.firebaseio.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleInputChange}
              placeholder="your-firestore-project-id"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Service Account Client Email</Label>
          <Input
            id="clientEmail"
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleInputChange}
            placeholder="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="privateKey">Service Account Private Key</Label>
            <div className="flex items-center text-xs text-muted-foreground">
              <Key className="h-3 w-3 mr-1" />
              <span>Include the BEGIN/END PRIVATE KEY lines</span>
            </div>
          </div>
          <Textarea
            id="privateKey"
            name="privateKey"
            value={formData.privateKey}
            onChange={handleInputChange}
            placeholder="-----BEGIN PRIVATE KEY-----\nXXXXX...\n-----END PRIVATE KEY-----"
            className="font-mono text-xs h-32"
          />
          <p className="text-xs text-muted-foreground mt-1">
            You can get this from the Firebase Console: Project Settings &gt;
            Service accounts &gt; Generate new private key
          </p>
        </div>

        <div className="mt-6 flex flex-col space-y-4">
          <Button
            type="button"
            onClick={testConnection}
            disabled={connectionStatus === "testing" || !isValid()}
            className="w-full md:w-auto"
          >
            {connectionStatus === "testing" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {connectionStatus === "success"
              ? "Test Again"
              : connectionStatus === "testing"
                ? "Testing..."
                : "Test Connection"}
          </Button>
          {renderConnectionStatus()}
        </div>
      </div>
    </div>
  );
}
