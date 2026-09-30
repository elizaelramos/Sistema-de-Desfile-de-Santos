import { Telao } from "@/components/telao";

export default async function PaginaPublica(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  return <Telao slug={slug} />;
}
