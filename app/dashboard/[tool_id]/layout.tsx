import { getToolPageStartData } from "@/app/actions/app-start";
import { ToolDataProvider } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { SiteURL } from "@/constants/site-url";
// import { ToolNotFoundException } from '@/exceptions/tool-not-found'
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type ViewToolPageProps = {
  children: React.ReactNode;
  params: Promise<{ tool_id: string }>;
};

const ViewToolLayout = async ({ children, params }: ViewToolPageProps) => {
  const { tool_id } = await params;
  try {
    const tool_page_start_data = await getToolPageStartData(tool_id);
    return (
      <ToolDataProvider
        tool={tool_page_start_data.current_tool}
        tool_db={tool_page_start_data.workspace_db}
        tool_messages={tool_page_start_data.tool_messages}
        tool_db_connected={tool_page_start_data.db_connected}
      >
        <div className="m-2 flex items-center justify-between">
          {/* Back to /dashboard */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Back to dashboard"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            asChild
            className="gap-2 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 ring-1 ring-primary/30"
          >
            <Link
              href={`${SiteURL.TOOL}/${tool_id}/edit`}
              aria-label="Edit this tool"
              className="flex flex-row items-center justify-center"
            >
              <Pencil className="h-4 w-4" />
              Edit Tool
            </Link>
          </Button>
        </div>

        {children}
      </ToolDataProvider>
    );
  } catch (error) {
    // if (error instanceof ToolNotFoundException) {
    //   notFound();
    // }
    throw error;
  }
};

export default ViewToolLayout;
