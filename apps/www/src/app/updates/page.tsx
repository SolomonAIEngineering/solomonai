import type { Metadata } from "next";
import { Article } from "@/components/article";
import { UpdatesToolbar } from "@/components/updates-toolbar";
import { getBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Updates",
};

export default async function Page() {
  const data = getBlogPosts();

  const posts = data
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .map((post, index) => <Article data={post} firstPost={index === 0} />);

  return (
    <div className="container flex justify-center scroll-smooth">
      <div className="w-full max-w-[680px] pt-[80px] md:pt-[150px]">
        {posts}
      </div>

      <UpdatesToolbar
        posts={data.map((post) => ({
          slug: post.slug,
          title: post.metadata.title,
        }))}
      />
    </div>
  );
}
