/* eslint-disable react/prop-types */
import { Stack } from '@mui/material';
import ClaimOriginalShare from './ClaimOriginalShare';

export default function ClaimPdfResult({ result, disabled, prepare, faxAction, feedbackId }) {
  return <Stack className="claim-result-actions" spacing={1.5}>
    <ClaimOriginalShare result={result} disabled={disabled} prepare={prepare}
      additionalActions={faxAction} feedbackId={feedbackId} />
  </Stack>;
}
