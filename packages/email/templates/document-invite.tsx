import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type { RecipientRole } from '@prisma/client';
import { OrganisationType } from '@prisma/client';

import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from '../components';
import { TemplateBrandingLogo } from '../template-components/template-branding-logo';
import { TemplateCustomMessageBody } from '../template-components/template-custom-message-body';
import type { TemplateDocumentInviteProps } from '../template-components/template-document-invite';
import { TemplateDocumentInvite } from '../template-components/template-document-invite';
import { TemplateFooter } from '../template-components/template-footer';
import { TemplateNewAccountWarning } from '../template-components/template-new-account-warning';

export type DocumentInviteEmailTemplateProps = Partial<TemplateDocumentInviteProps> & {
  customBody?: string;
  role: RecipientRole;
  selfSigner?: boolean;
  teamName?: string;
  teamEmail?: string;
  includeSenderDetails?: boolean;
  organisationType?: OrganisationType;
  reportUrl?: string;

  /**
   * The user's own email, not a team email, so the recipient can verify who
   * actually contacted them.
   */
  newAccountWarningSenderEmail?: string;
};

export const DocumentInviteEmailTemplate = ({
  inviterName = 'Lucas Smith',
  inviterEmail = 'lucas@documenso.com',
  documentName = 'Open Source Pledge.pdf',
  signDocumentLink = 'https://documenso.com',
  assetBaseUrl = 'http://localhost:3002',
  customBody,
  role,
  selfSigner = false,
  teamName = '',
  includeSenderDetails,
  organisationType,
  reportUrl,
  newAccountWarningSenderEmail,
}: DocumentInviteEmailTemplateProps) => {
  const { _ } = useLingui();

  const action = _(RECIPIENT_ROLES_DESCRIPTION[role].actionVerb).toLowerCase();

  let previewText = msg`${inviterName} has invited you to ${action} ${documentName}`;

  if (organisationType === OrganisationType.ORGANISATION) {
    previewText = includeSenderDetails
      ? msg`${inviterName} on behalf of "${teamName}" has invited you to ${action} ${documentName}`
      : msg`${teamName} has invited you to ${action} ${documentName}`;
  }

  if (selfSigner) {
    previewText = msg`Please ${action} your document ${documentName}`;
  }

  const hasSenderDetails = organisationType === OrganisationType.PERSONAL;
  const hasMessage = Boolean(customBody?.trim());

  const senderMessage =
    hasSenderDetails || hasMessage ? (
      <Section
        className="mt-6 rounded-lg bg-muted px-5 pt-0 pb-4"
        style={{ borderLeft: `4px solid ${QUOTE_ACCENT_COLOR}` }}
      >
        {hasMessage ? (
          <TemplateCustomMessageBody text={customBody} />
        ) : (
          <Text className="text-base text-muted-foreground">
            <Trans>
              {inviterName} has invited you to {action} the document "{documentName}".
            </Trans>
          </Text>
        )}

        {hasSenderDetails && (
          <Text className="mt-0 mb-0 font-semibold text-foreground text-sm">
            <Trans>
              — {inviterName}{' '}
              <Link className="font-normal text-muted-foreground" href={`mailto:${inviterEmail}`}>
                ({inviterEmail})
              </Link>
            </Trans>
          </Text>
        )}
      </Section>
    ) : null;

  return (
    <Html>
      <Head />

      <Body className="mx-auto my-auto bg-[#f4f4f7] px-2 py-8 font-sans">
        <Preview>{_(previewText)}</Preview>

        <Section>
          {newAccountWarningSenderEmail && (
            <TemplateNewAccountWarning senderEmail={newAccountWarningSenderEmail} reportUrl={reportUrl} />
          )}

          <Container className="mx-auto max-w-xl rounded-xl border border-border border-solid bg-background px-8 pt-8 pb-6">
            <Section>
              <TemplateBrandingLogo assetBaseUrl={assetBaseUrl} className="mb-4 h-8" />

              <Hr className="my-0 border-border" />

              <TemplateDocumentInvite
                inviterName={inviterName}
                inviterEmail={inviterEmail}
                documentName={documentName}
                signDocumentLink={signDocumentLink}
                assetBaseUrl={assetBaseUrl}
                role={role}
                selfSigner={selfSigner}
                organisationType={organisationType}
                teamName={teamName}
                includeSenderDetails={includeSenderDetails}
                message={senderMessage}
              />

              <Text className="mt-8 mb-0 text-muted-foreground text-xs leading-5">
                <Trans>Button not working? Copy and paste this link into your browser:</Trans>
                <br />
                <Link className="break-all text-primary" href={signDocumentLink}>
                  {signDocumentLink}
                </Link>
              </Text>
            </Section>
          </Container>

          <Container className="mx-auto max-w-xl px-8">
            <TemplateFooter reportUrl={reportUrl} />
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

const QUOTE_ACCENT_COLOR = '#4f46e5';

export default DocumentInviteEmailTemplate;
