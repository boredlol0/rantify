import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import RantPageClient from './client';

// This function will be called at build time to generate static paths
export async function generateStaticParams() {
  const supabase = createServerComponentClient({ cookies });
  
  // Only pre-render public rants
  const { data: publicRants } = await supabase
    .from('rants')
    .select('id')
    .eq('is_private', false);

  return publicRants?.map((rant) => ({
    rantId: rant.id,
  })) || [];
}

// Enable dynamic rendering for routes not covered by generateStaticParams
export const dynamicParams = true;

export default async function RantPage({ params }: { params: { rantId: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: rantData } = await supabase
    .from('rants')
    .select(`
      *,
      owner:owner_id (
        user_metadata
      )
    `)
    .eq('id', params.rantId)
    .single();

  return <RantPageClient initialRant={rantData} />;
}