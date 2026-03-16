import { redirect } from "next/navigation";

type JoinPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const rawRef = resolvedSearchParams.ref;
  const ref = Array.isArray(rawRef) ? rawRef[0] : rawRef;

  if (ref) {
    redirect(`/?ref=${encodeURIComponent(ref)}#waitlist`);
  }

  redirect("/#waitlist");
}
