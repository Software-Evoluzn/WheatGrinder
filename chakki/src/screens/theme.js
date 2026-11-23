// =============================================================================
//  DESIGN TOKENS  —  single source of truth for the whole app
// -----------------------------------------------------------------------------
//  Purple-first brand system. Every screen and shared component reads from here
//  so colours, spacing, type, radii and shadows stay identical everywhere.
//  Consumed directly (no React hook) so it drops into any screen safely.
// -----------------------------------------------------------------------------
//  MERGED (Developer 1 + Developer 2):
//    • Tokens below (colors/spacing/radii/typography/motion/layout/zIndex/
//      shadows/statusPalette) are IDENTICAL in both developers' versions.
//    • Developer 1 added the RESPONSIVE SCALING helpers (guidelineBaseWidth,
//      scaleSize, moderateScale, clamp) — kept here because ./ui imports them.
//      Developer 2's theme is a subset of this, so nothing is lost.
// =============================================================================

export const colors = {
  // ---- Brand ----
  primary: '#55327A',
  primaryDark: '#3E1A5B',
  primaryPressed: '#472A68',

  // ---- Tints of the brand purple ----
  primaryTint: '#F3EEFA',
  primaryTintBorder: '#E4D9F2',
  primarySubtle: '#EDE4F6',

  // ---- Semantic status colours (subtle, brand-consistent) ----
  success: '#16A34A',
  successTint: '#E8F7EE',
  danger: '#DC2626',
  dangerTint: '#FDEDED',
  warning: '#EA580C',
  warningTint: '#FDEEE5',
  // "info" is intentionally purple, not blue — it replaces the stray #5B8DEF
  // blues that used to appear on operational screens so nothing breaks brand.
  info: '#55327A',
  infoTint: '#F3EEFA',

  // ---- Neutrals — purple-tinted rather than pure gray/black ----
  textPrimary: '#231536',
  textSecondary: '#6B5B7A',
  textMuted: '#9A8FAE',
  textDisabled: '#C7BFD4',
  textOnPrimary: '#FFFFFF',

  border: '#E9E2F1',
  borderStrong: '#D9D2E3',
  divider: '#EFEAF5',

  surface: '#FFFFFF',
  surfaceAlt: '#FAF8FC',
  background: '#F5F2FA',
  overlay: 'rgba(35, 21, 54, 0.45)',

  iconDefault: '#55327A',
  iconMuted: '#9A8FAE',
  iconOnPrimary: '#FFFFFF',

  disabledBg: '#EFEAF5',
  disabledText: '#B9AFC7',
};

export const spacing = {
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40,
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

export const typography = {
  display: { fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '500' },
  bodySmall: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  button: { fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
};

export const motion = {
  duration: { fast: 150, base: 250, slow: 400 },
  press: { scaleDown: 0.97 },
};

export const layout = {
  minTouchTarget: 44,
  headerContentHeight: 56,
  screenPaddingHorizontal: 24,
};

export const zIndex = {
  header: 10, floatingElement: 20, overlay: 100, modal: 200, toast: 300,
};

export const shadows = {
  subtle: { shadowColor: '#3E1A5B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  card: { shadowColor: '#3E1A5B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  button: { shadowColor: '#3E1A5B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 3 },
  header: { shadowColor: '#3E1A5B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  floatingNav: { shadowColor: '#3E1A5B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 8 },
};

// =============================================================================
//  RESPONSIVE SCALING  —  pure helpers (no hooks), safe to use in StyleSheet
//  [Developer 1]
// -----------------------------------------------------------------------------
//  Screens that need window-aware sizing should prefer the `useResponsive` hook
//  from ./ui (it re-renders on rotation / split-screen). These pure helpers are
//  for one-off static scaling and are driven off a reference phone width so the
//  design looks identical to how it was authored on a ~390pt-wide device.
// =============================================================================
export const guidelineBaseWidth = 390; // reference design width (pt)

const clampNum = (v, min, max) => Math.min(Math.max(v, min), max);

// Linear scale against the device width, gently clamped so small phones don't
// get unreadably tiny text and large phones / tablets don't blow things up.
export const scaleSize = (size, width = guidelineBaseWidth, { min = 0.85, max = 1.25 } = {}) => {
  const factor = clampNum(width / guidelineBaseWidth, min, max);
  return Math.round(size * factor);
};

// Moderate scale: only apply a fraction of the delta (default 0.5). Best for
// font sizes, where full linear scaling feels too aggressive.
export const moderateScale = (size, width = guidelineBaseWidth, factor = 0.5) => {
  const full = scaleSize(size, width);
  return Math.round(size + (full - size) * factor);
};

export const clamp = clampNum;

// Variant -> colour pair, so status screens resolve a look in one place.
export const statusPalette = {
  info: { color: colors.info, tint: colors.infoTint, border: colors.primaryTintBorder },
  success: { color: colors.success, tint: colors.successTint, border: '#CBEBD6' },
  warning: { color: colors.warning, tint: colors.warningTint, border: '#F8D9C4' },
  danger: { color: colors.danger, tint: colors.dangerTint, border: '#F6C9C9' },
};

export default {
  colors, spacing, radii, typography, motion, layout, zIndex, shadows, statusPalette,
  guidelineBaseWidth, scaleSize, moderateScale, clamp,
};