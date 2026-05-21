import { InviteClient } from './InviteClient';

interface Params {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Params) {
  const { token } = await params;
  return <InviteClient token={token} />;
}
