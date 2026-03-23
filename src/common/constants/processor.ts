
import { ACTIONS } from '@rahat/token-disbursement-actions';

export const PROCESSOR = {
  RESPONSE: 'projectresponse',
} as const;

export const PROCESSOR_JOB = {
  DISBURSEMENT: ACTIONS.DISBURSEMENT.name,
} as const;
