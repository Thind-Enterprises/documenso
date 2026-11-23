import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { OrganisationType, RecipientRole } from '@prisma/client';
import type { ReactNode } from 'react';
import { match, P } from 'ts-pattern';

import { Button, Column, Row, Section, Text } from '../components';

export interface TemplateDocumentInviteProps {
  inviterName: string;
  inviterEmail: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl: string;
  role: RecipientRole;
  selfSigner: boolean;
  teamName?: string;
  includeSenderDetails?: boolean;
  organisationType?: OrganisationType;
  /** Rendered between the heading and the document card, e.g. the sender's message. */
  message?: ReactNode;
}

export const TemplateDocumentInvite = ({
  inviterName,
  documentName,
  signDocumentLink,
  role,
  selfSigner,
  teamName,
  includeSenderDetails,
  organisationType,
  message,
}: TemplateDocumentInviteProps) => {
  const { _ } = useLingui();

  const { actionVerb } = RECIPIENT_ROLES_DESCRIPTION[role];

  return (
    <Section>
      <Text className="mt-6 mb-0 font-semibold text-foreground text-xl leading-7">
        {match({ selfSigner, organisationType, includeSenderDetails, teamName })
          .with({ selfSigner: true }, () => <Trans>Please {_(actionVerb).toLowerCase()} your document</Trans>)
          .with(
            {
              organisationType: OrganisationType.ORGANISATION,
              includeSenderDetails: true,
              teamName: P.string,
            },
            () => (
              <Trans>
                {inviterName} on behalf of "{teamName}" has invited you to {_(actionVerb).toLowerCase()} a document
              </Trans>
            ),
          )
          .with({ organisationType: OrganisationType.ORGANISATION, teamName: P.string }, () => (
            <Trans>
              {teamName} has invited you to {_(actionVerb).toLowerCase()} a document
            </Trans>
          ))
          .otherwise(() => (
            <Trans>
              {inviterName} has invited you to {_(actionVerb).toLowerCase()} a document
            </Trans>
          ))}
      </Text>

      <Text className="mt-2 mb-0 text-base text-muted-foreground">
        {match(role)
          .with(RecipientRole.SIGNER, () => <Trans>Continue by signing the document.</Trans>)
          .with(RecipientRole.VIEWER, () => <Trans>Continue by viewing the document.</Trans>)
          .with(RecipientRole.APPROVER, () => <Trans>Continue by approving the document.</Trans>)
          .with(RecipientRole.CC, () => '')
          .with(RecipientRole.ASSISTANT, () => <Trans>Continue by assisting with the document.</Trans>)
          .exhaustive()}
      </Text>

      {message}

      <Section className="mt-6 rounded-lg border border-border border-solid bg-muted">
        <Row>
          <Column className="w-12 py-4 pl-4 align-middle">
            <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
              <tbody>
                <tr>
                  <td
                    align="center"
                    valign="middle"
                    className="h-10 w-10 rounded-md border border-border border-solid bg-background font-bold text-[11px] text-primary tracking-wider"
                  >
                    PDF
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
          <Column className="py-4 pr-4 pl-3 align-middle">
            <Text className="m-0 break-all font-semibold text-base text-foreground leading-6">{documentName}</Text>
            <Text className="m-0 text-muted-foreground text-sm leading-5">
              <Trans>Sent by {inviterName}</Trans>
            </Text>
          </Column>
        </Row>
      </Section>

      <Section className="mt-6">
        <Button
          className="box-border block w-full rounded-lg bg-primary px-6 py-3.5 text-center font-semibold text-base text-primary-foreground no-underline"
          href={signDocumentLink}
        >
          {match(role)
            .with(RecipientRole.SIGNER, () => <Trans>Review and sign</Trans>)
            .with(RecipientRole.VIEWER, () => <Trans>View Document</Trans>)
            .with(RecipientRole.APPROVER, () => <Trans>Review and approve</Trans>)
            .with(RecipientRole.CC, () => <Trans>View Document</Trans>)
            .with(RecipientRole.ASSISTANT, () => <Trans>Review and assist</Trans>)
            .exhaustive()}
        </Button>
      </Section>
    </Section>
  );
};

export default TemplateDocumentInvite;
