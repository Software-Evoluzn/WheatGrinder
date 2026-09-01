

export const colors = {
  // ---- Brand (unchanged) ----
  primary: '#55327A',
  primaryDark: '#3E1A5B',
  primaryPressed: '#472A68', // darker brand purple for pressed/active states

  // ---- Tints of the brand purple — soft backgrounds, icon chips, selected states ----
  primaryTint: '#F3EEFA',
  primaryTintBorder: '#E4D9F2',
  primarySubtle: '#EDE4F6',

  // ---- Semantic status colors (kept from your existing screens) ----
  success: '#16A34A',
  successTint: '#E8F7EE',
  danger: '#DC2626',
  dangerTint: '#FDEDED',
  warning: '#EA580C',
  warningTint: '#FDEEE5',

  // ---- Neutrals — purple-tinted rather than pure gray/black, for a
  // warmer, more premium feel than plain black-on-white ----
  textPrimary: '#231536',
  textSecondary: '#6B5B7A',
  textMuted: '#9A8FAE',
  textDisabled: '#C7BFD4',
  textOnPrimary: '#FFFFFF',

  border: '#E9E2F1',
  borderStrong: '#D9D2E3',
  divider: '#EFEAF5', // fainter than `border` — for hairlines inside a card/list, not card edges

  surface: '#FFFFFF',
  surfaceAlt: '#FAF8FC',
  background: '#F5F2FA',
  overlay: 'rgba(35, 21, 54, 0.45)', // purple-tinted modal/backdrop scrim, not flat black

  iconDefault: '#55327A',
  iconMuted: '#9A8FAE',
  iconOnPrimary: '#FFFFFF',

  disabledBg: '#EFEAF5',
  disabledText: '#B9AFC7',
};

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '500' },
  bodySmall: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  button: { fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }, // form field labels
};

// Shared animation timing so every screen/component's micro-interactions
// feel consistent instead of each one picking its own speed.
export const motion = {
  duration: {
    fast: 150, // press feedback, small toggles
    base: 250, // default transitions
    slow: 400, // larger state changes (e.g. phase switches)
  },
  press: {
    scaleDown: 0.97, // used by PrimaryButton's press-in animation
  },
};

// A few shared sizing constants, not a full layout system.
export const layout = {
  minTouchTarget: 44, // Apple/Google's minimum recommended tappable size
  headerContentHeight: 56, // AppHeader's row height, excluding the safe-area inset
  screenPaddingHorizontal: 24,
};

// Named layering so overlapping elements (headers, sheets, toasts) stack
// predictably instead of arbitrary per-screen zIndex numbers.
export const zIndex = {
  header: 10,
  floatingElement: 20,
  overlay: 100,
  modal: 200,
  toast: 300,
};

// Soft, purple-tinted shadows instead of harsh black ones — this is what
// gives cards a lifted, "premium" feel instead of a flat default look.
export const shadows = {
  // Very light lift — inputs, dividers, anything that shouldn't look like
  // a full card but still wants to sit slightly above the background.
  subtle: {
    shadowColor: '#3E1A5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#3E1A5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  button: {
    shadowColor: '#3E1A5B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  // Lighter than `card` — used on AppHeader so it reads as a subtle
  // "floating" separation from the content below, not a heavy panel.
  header: {
    shadowColor: '#3E1A5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  // Used by anything that floats above content with visible margin on all
  // sides (e.g. a floating action button, a floating bar).
  floatingNav: {
    shadowColor: '#3E1A5B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
};

export default { colors, spacing, radii, typography, motion, layout, zIndex, shadows };