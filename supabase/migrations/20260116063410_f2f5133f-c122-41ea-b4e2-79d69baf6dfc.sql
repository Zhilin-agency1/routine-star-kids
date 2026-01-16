-- Add job_claim_id column to task_instances for stable job-task linking
ALTER TABLE public.task_instances
ADD COLUMN job_claim_id uuid NULL REFERENCES public.job_claims(id) ON DELETE SET NULL;

-- Create unique index to prevent duplicate task instances per job claim
CREATE UNIQUE INDEX task_instances_unique_job_claim 
ON public.task_instances (job_claim_id) 
WHERE job_claim_id IS NOT NULL;

-- Create index for faster job claim lookups
CREATE INDEX task_instances_job_claim_id_idx 
ON public.task_instances (job_claim_id) 
WHERE job_claim_id IS NOT NULL;