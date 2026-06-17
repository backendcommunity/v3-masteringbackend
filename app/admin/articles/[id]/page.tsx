"use client";

import { useParams } from "next/navigation";
import { ArticleEditor } from "@/components/pages/admin/article-editor";

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-background">
      <ArticleEditor articleId={params?.id} />
    </div>
  );
}
