"use client";

import { createChatMessage } from "@/app/actions/message/create-message";
import { updateAssistantMessageDeploymentId } from "@/app/actions/message/update-message";
import {
  updateCurrentToolMessage,
  updateToolLatestCodeArtifact,
} from "@/app/actions/tool/update-tool";
import { deployThroughFiles } from "@/app/actions/vercel/deploy";
import { usePageStore } from "@/app/store/page-store";
import useProfileStore from "@/app/store/profile-store";
import useStripeCustomerStore from "@/app/store/stripe-customer-store";
import { useToolMessageStore } from "@/app/store/tool-message-store";
import { useToolStore } from "@/app/store/tool-store";
import { mergeCodeArtifacts } from "@/app/store/tool-store";
import { useToolViewStore } from "@/app/store/tool-view-store";
import useWorkspaceStore from "@/app/store/workspace-store";
import { Chat } from "@/components/chat";
import { ChatInput } from "@/components/chat-input";
import { LogoLink } from "@/components/nav/logo-link";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Templates } from "@/constants/templates";
import { ToolViewTab } from "@/constants/tool-view-tab";
import { truncateMessages } from "@/lib/chat-utils";
import { TemplateId } from "@/lib/generated/prisma";
import { Message, toAISDKMessages } from "@/lib/messages";
import { LLMModelConfig } from "@/lib/models";
import modelsList from "@/lib/models.json";
import { CodeArtifact, codeArtifactSchema } from "@/lib/schema";
import { DeploymentResult } from "@/lib/types";
import { parseNavPagesFromCodeArtifact } from "@/lib/utils";
import { CoreMessage, DeepPartial } from "ai";
import { experimental_useObject as useObject } from "ai/react";
import type React from "react";
import { useRef, useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";

export default function ChatLeftPanel() {
  const MAX_MSGS = 6; // at max pass in N msgs to llm as context
  const { toast } = useToast();

  // ========================= zustand states ===============================

  const messages = useToolMessageStore((state) => state.page_messages) || [];

  const messagesRef = useRef<Message[]>(messages); //  for accessing inside the useObject closure
  const user = useProfileStore((state) => state.user);
  const debugQueue = useToolMessageStore((state) => state.debugQueue);
  const { dequeueDebugRequest } = useToolMessageStore();

  const { setCurrentNavPage } = useToolViewStore();

  const { current_tool, tool_db_connected, tool_db } = useToolStore(
    useShallow((state) => ({
      current_tool: state.current_tool,
      tool_db_connected: state.tool_db_connected,
      tool_db: state.tool_db,
    }))
  );

  const numToolMsgUsed = useStripeCustomerStore(
    (state) => state.num_tool_message_used
  );

  const { incrementNumToolMessagesUsed, getMaxAllowedMsgsPerDay } =
    useStripeCustomerStore();
  const remainingDailyMessages = Math.max(
    0,
    getMaxAllowedMsgsPerDay() - (numToolMsgUsed || 0)
  );

  const { setLastMessage, addMessage } = useToolMessageStore();

  const { current_workspace_id } = useWorkspaceStore(
    (state: string | any) => state.current_workspace_id
  );

  const {
    setCodeArtifact,
    setDeploymentResult,
    setCurrentTab,
    setIsPreviewLoading,
    updateToolToNavPages,
  } = useToolViewStore();

  const global_code_artifact = useToolViewStore(
    (state) => state.global_code_artifact
  );

  // ========================= local states ===============================

  const [chatInput, setChatInput] = useLocalStorage("chat", "");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== "ollama";
    }
    return true;
  });
  // TODO: refactor these states to a LLM store
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    "languageModel",
    {
      model: "claude-3-5-sonnet-latest",
    } as LLMModelConfig
  );
  const currentModel = filteredModels.find(
    (model) => model.id === languageModel.model
  );

  const lastMessage = messages[messages.length - 1];

  function handleSaveInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setChatInput(e.target.value);
  }

  function setCurrentPreviewData(preview: {
    code_artifact: DeepPartial<CodeArtifact> | undefined;
    deploymentResult: DeploymentResult | undefined;
  }) {
    if (preview?.code_artifact?.page) {
      setCurrentNavPage(preview.code_artifact.page);
    }
    setCodeArtifact(preview.code_artifact);
    setDeploymentResult(preview.deploymentResult);
  }

  const onAIGeneratedError = (error: Error) => {
    console.error("Error submitting request:", error);
    if (error.message.includes("limit")) {
      setIsRateLimited(true);
    }

    setErrorMessage(error.message);
  };

  const onAIGeneratedCodeFinish = async ({
    object: codeArtifact,
    error,
  }: {
    object: CodeArtifact | undefined;
    error: Error | undefined;
  }) => {
    if (error) {
      throw new Error("ai geenrate code finish returned with error: ", error);
    }
    if (!current_tool || !current_tool.id) {
      throw new Error("No current tool");
    }
    if (!codeArtifact) {
      console.log("no code artifact generated: ", codeArtifact);
      setIsChatLoading(false);
      return;
    }

    console.log("AI generated code artifact:", codeArtifact);
    const latestMessages = messagesRef.current;
    const last_msg = latestMessages[latestMessages.length - 1];
    setIsChatLoading(false);
    if (!codeArtifact.code || codeArtifact.code.length == 0) {
      // No code is generated, save the message and return
      if (last_msg && last_msg.role === "assistant") {
        // no need to update messageId here since it's a commentary only resposne
        await createChatMessage(last_msg);
      }
      return;
    }

    setIsPreviewLoading(true);
    // determine the page name LLM was editing (need to send to preview)
    const mergedCodeArtifact = mergeCodeArtifacts(
      codeArtifact,
      global_code_artifact as CodeArtifact | undefined
    );

    // deploy all pages
    try {
      setCurrentTab(ToolViewTab.PREVIEW);
      setIsPreviewLoading(false);
      const deploymentResult = await deployThroughFiles(
        mergedCodeArtifact,
        tool_db!,
        user!.id,
        current_tool.id,
        TemplateId.nextjs15_v1
      );

      // update the tool to nav pages
      const navPages = parseNavPagesFromCodeArtifact(
        TemplateId.nextjs15_v1,
        mergedCodeArtifact
      );
      updateToolToNavPages(current_tool.id, navPages);

      // use message ref to access latest messages
      const latestMessages = messagesRef.current;
      const last_msg = latestMessages[latestMessages.length - 1];
      if (
        last_msg &&
        last_msg.role === "assistant" &&
        last_msg.codeArtifact?.code
      ) {
        last_msg.deploymentResult = deploymentResult;
        last_msg.codeArtifact = mergedCodeArtifact;
        // create assistant message
        const assistant_msg_id = await createChatMessage(last_msg);
        // save the latest merged code artifact to tool
        await updateToolLatestCodeArtifact(current_tool.id, mergedCodeArtifact);
        updateCurrentToolMessage(current_tool.id, assistant_msg_id);

        // update the preview link with deployment result
        setCurrentPreviewData({
          code_artifact: mergedCodeArtifact,
          deploymentResult,
        });
      }
    } catch (err) {
      console.error("❌ /api/sandbox deploy failed:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // generate the code with new api
  const {
    object: generatedCode,
    submit: submitCodeGenerationRequest,
    isLoading: isLoadingCodeGeneration,
    stop: stopCodeGeneration,
    error: errorCodeGeneration,
  } = useObject<CodeArtifact>({
    api: "/api/chat/ai",
    schema: codeArtifactSchema,
    onError: onAIGeneratedError,
    onFinish: onAIGeneratedCodeFinish,
  });

  useEffect(() => {
    if (debugQueue.length === 0) return;
    const requests = dequeueDebugRequest();
    const errors = requests.map((r) => r.requestContent).join("\n");
    // TODO: Cache the debug error in the msg object
    const userDebugMsg = `For the code present, I get the following errors. Please think step-by-step in order to resolve it:
        Errors: ${errors}`;
    // submit a user msg to the llm
    submitUserMsg(userDebugMsg);
  }, [debugQueue]);

  useEffect(() => {
    // update messageRef to match messages
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (generatedCode) {
      setCodeArtifact(generatedCode);
      const content: Message["content"] = [
        { type: "text", text: generatedCode.commentary || "" },
        {
          type: "code",
          text:
            generatedCode.code
              ?.map((code) => code?.file_content || "")
              .join("\n") || "",
        },
      ];

      if (!lastMessage || lastMessage.role !== "assistant") {
        // first msg or last msg was from user
        addMessage({
          role: "assistant",
          content,
          codeArtifact: generatedCode,
          toolId: current_tool?.id || "",
        });
      }

      if (lastMessage && lastMessage.role === "assistant") {
        setLastMessage({
          content,
          codeArtifact: generatedCode,
        });
      }
    }
  }, [generatedCode]);

  function retry() {
    submitCodeGenerationRequest({
      userID: user?.id,
      messages: toAISDKMessages(
        truncateMessages(messagesRef.current, MAX_MSGS)
      ) as CoreMessage[],
      template: Templates["nextjs15-v1"],
      model: currentModel,
      projectId: current_tool?.id,
    });
  }

  function stop() {
    stopCodeGeneration();
    setIsChatLoading(false);
  }

  async function submitUserMsg(userMsg: string) {
    if (isChatLoading) {
      stop();
      return;
    }
    if (!tool_db_connected) {
      toast({
        title: "DB not connected",
        description: "We couldn’t reach the database. Please try again later.",
        variant: "destructive",
      });
    }
    if (numToolMsgUsed >= getMaxAllowedMsgsPerDay()) {
      toast({
        title: "Message limit reached",
        description:
          "You’ve hit the daily message limit. Upgrade your plan or try again tomorrow.",
        variant: "destructive",
      });
      return;
    }

    setIsChatLoading(true);
    setDeploymentResult(undefined);

    const content: Message["content"] = [{ type: "text", text: userMsg }];
    const msg: Message = {
      role: "user",
      content,
      toolId: current_tool?.id || "",
    };

    setChatInput("");
    setCurrentTab(ToolViewTab.CODE);

    const updatedMessages = addMessage(msg);
    const aiSdkMessages = toAISDKMessages(
      truncateMessages(updatedMessages, MAX_MSGS)
    ) as CoreMessage[];
    incrementNumToolMessagesUsed();
    console.log("AI SDK messages:", aiSdkMessages);

    submitCodeGenerationRequest({
      userID: user?.id,
      messages: aiSdkMessages,
      template: Templates["nextjs15-v1"],
      model: currentModel,
      projectId: current_tool?.id,
    });
    // save the user message to the database and update the state after get the id
    const msg_id = await createChatMessage(msg);
    msg.id = msg_id;
    setLastMessage(msg);
  }

  async function handleSendPrompt(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitUserMsg(chatInput);
  }

  return (
    <Card className="w-full h-full flex flex-col shadow-none border-0 rounded-none">
      <div className="p-2 py-3 border-b flex items-center">
        <div className="flex items-center">
          <span className="ml-2 text-lg font-semibold">
            {current_tool?.name}
          </span>
        </div>
      </div>
      <Chat
        messages={messages}
        isLoading={isChatLoading}
        setCurrentPreview={setCurrentPreviewData}
      />

      {/* Prompt input */}
      <ChatInput
        retry={retry}
        isErrored={errorCodeGeneration !== undefined}
        errorMessage={errorMessage}
        isLoading={isChatLoading}
        isRateLimited={isRateLimited}
        stop={stop}
        input={chatInput}
        handleInputChange={handleSaveInputChange}
        handleSubmit={handleSendPrompt}
        isMultiModal={currentModel?.multiModal || false}
        remainingCredits={remainingDailyMessages}
      >
        <span className="flex items-center justify-between w-full"></span>
      </ChatInput>
    </Card>
  );
}
