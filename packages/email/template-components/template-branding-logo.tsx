import { Img, Link } from '../components';
import { useBranding } from '../providers/branding';
import { getEmailAssetUrl } from '../utils/asset-url';
import { getSafeBrandingUrl } from '../utils/branding-url';

export type TemplateBrandingLogoProps = {
  assetBaseUrl: string;
  className?: string;
};

/**
 * Renders the email logo.
 *
 * - When custom branding is enabled with a logo, the branding logo is shown.
 *   If a safe (http/https) Brand Website is configured, the logo links to it.
 * - Otherwise the Documenso logo is shown.
 */
export const TemplateBrandingLogo = ({ assetBaseUrl, className = 'mb-4 h-6' }: TemplateBrandingLogoProps) => {
  const branding = useBranding();

  const hasCustomBrandingLogo = branding.brandingEnabled && Boolean(branding.brandingLogo);

  if (!hasCustomBrandingLogo) {
    return <TemplateCorteronLockup assetBaseUrl={assetBaseUrl} />;
  }

  const brandingLogo = <Img src={branding.brandingLogo} alt="Branding Logo" className={className} />;

  const safeBrandingUrl = getSafeBrandingUrl(branding.brandingUrl);

  if (!safeBrandingUrl) {
    return brandingLogo;
  }

  return (
    <Link href={safeBrandingUrl} target="_blank">
      {brandingLogo}
    </Link>
  );
};

/**
 * Default Corteron lockup: crest on a dark indigo tile + wordmark.
 *
 * The crest PNG is white line-art on a transparent background, so it is
 * invisible on a white email unless it sits on a dark surface (mirrors the
 * app's `CrestChip`). Built with tables + inline styles for email clients;
 * `bgcolor` is kept alongside `background-color` for Outlook.
 */
const TemplateCorteronLockup = ({ assetBaseUrl }: { assetBaseUrl: string }) => {
  const logoUrl = getEmailAssetUrl(assetBaseUrl, 'static/logo.png');

  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: 16 }}>
      <tbody>
        <tr>
          <td
            {...LEGACY_BGCOLOR_ATTRS}
            width={36}
            height={36}
            align="center"
            valign="middle"
            style={{
              width: 36,
              height: 36,
              backgroundColor: CREST_TILE_COLOR,
              borderRadius: 8,
              lineHeight: 0,
            }}
          >
            <Img src={logoUrl} alt="Corteron" width={26} height={26} style={{ display: 'block', margin: '0 auto' }} />
          </td>
          <td
            valign="middle"
            style={{
              paddingLeft: 10,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.14em',
              lineHeight: '36px',
              color: CREST_WORDMARK_COLOR,
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            CORTERON
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const CREST_TILE_COLOR = '#1e1b4b';
const CREST_WORDMARK_COLOR = '#1e1b4b';

// `bgcolor` isn't in React's td typings but is still needed for Outlook.
const LEGACY_BGCOLOR_ATTRS = { bgcolor: CREST_TILE_COLOR } as Record<string, string>;

export default TemplateBrandingLogo;
