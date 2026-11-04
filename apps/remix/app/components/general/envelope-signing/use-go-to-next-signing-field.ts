import { useCurrentEnvelopeRender } from '@documenso/lib/client-only/providers/envelope-render-provider';
import { PDF_VIEWER_CONTENT_SELECTOR } from '@documenso/lib/constants/pdf-viewer';

import { useRequiredEnvelopeSigningContext } from '../document-signing/envelope-signing-provider';

/**
 * Returns a callback that highlights the recipient's next required field and scrolls it into view,
 * switching to the envelope item that holds it when needed.
 */
export const useGoToNextSigningField = () => {
  const { recipientFieldsRemaining, setShowPendingFieldTooltip } = useRequiredEnvelopeSigningContext();
  const { currentEnvelopeItem, setCurrentEnvelopeItem } = useCurrentEnvelopeRender();

  return () => {
    const nextField = recipientFieldsRemaining[0];

    if (!nextField) {
      setShowPendingFieldTooltip(false);
      return;
    }

    const isEnvelopeItemSwitch = nextField.envelopeItemId !== currentEnvelopeItem?.id;

    if (isEnvelopeItemSwitch) {
      setCurrentEnvelopeItem(nextField.envelopeItemId);
    }

    setShowPendingFieldTooltip(true);

    setTimeout(
      () => {
        const fieldTooltip = document.querySelector(`#field-tooltip`);

        if (fieldTooltip) {
          fieldTooltip.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Tooltip not in DOM (page virtualized away) — signal the PDF viewer
          // to scroll to the correct page via the data attribute.
          const pdfContent = document.querySelector(PDF_VIEWER_CONTENT_SELECTOR);

          if (pdfContent) {
            pdfContent.setAttribute('data-scroll-to-page', String(nextField.page));
          }
        }
      },
      isEnvelopeItemSwitch ? 150 : 50,
    );
  };
};
