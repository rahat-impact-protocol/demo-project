// import { ACTIONS } from '@rahat/token-disbursement-actions';

export const PROCESSOR = {
  RESPONSE: 'projectresponse',
} as const;

export const PROCESSOR_JOB = {
  DISBURSEMENT: 'disbursement',
  SENDSMS: 'sendSms',
  CLAIMCREATE: 'claimCreate',
  VERIFYOTP: 'verifyOtp',
  REDEMPTIONREQUEST: 'redemptionRequest',
  REDEMPTIONAPPROVAL: 'redemptionApproval',

  // ACTIONS.DISBURSEMENT.name,
} as const;
