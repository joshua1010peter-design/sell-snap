const fs = require('fs');
const path = require('path');

const tokensDir = __dirname;
const colorTokensPath = path.join(tokensDir, 'color-tokens.json');
const designTokensPath = path.join(tokensDir, 'design-tokens.tokens.json');
const outputCssPath = path.join(tokensDir, 'design-tokens.css');

const colorTokens = JSON.parse(fs.readFileSync(colorTokensPath, 'utf8'));
const designTokens = JSON.parse(fs.readFileSync(designTokensPath, 'utf8'));

function resolveColorRef(ref, tokens) {
  const match = ref.match(/^\{(.+)\}$/);
  if (!match) return ref;

  const parts = match[1].split('.');
  let value = tokens;
  for (const part of parts) {
    if (value[part] !== undefined) {
      value = value[part];
    } else {
      console.warn(`Warning: Could not resolve "${ref}" - "${part}" not found`);
      return ref;
    }
  }

  if (typeof value === 'string' && value.startsWith('{')) {
    return resolveColorRef(value, tokens);
  }

  return value;
}

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function tokenNameToCssVar(name) {
  const parts = name.replace(/\\/g, '-').replace(/\s+/g, '-').toLowerCase().split('-').filter(Boolean);
  const unique = [...new Set(parts)];
  return '--text-' + unique.join('-');
}

function generateColorCSS(tokens) {
  let css = '';

  const lightRoles = tokens.color.role.light;
  const darkRoles = tokens.color.role.dark;

  css += ':root {\n';
  for (const [roleName, ref] of Object.entries(lightRoles)) {
    const value = resolveColorRef(ref, tokens);
    css += `  --color-${camelToKebab(roleName)}: ${value};\n`;
  }
  css += '}\n\n';

  css += '[data-theme="dark"] {\n';
  for (const [roleName, ref] of Object.entries(darkRoles)) {
    const value = resolveColorRef(ref, tokens);
    css += `  --color-${camelToKebab(roleName)}: ${value};\n`;
  }
  css += '}\n\n';

  return css;
}

function generateTypographyCSS(tokens) {
  let css = ':root {\n';

  const typography = tokens.typography;

  for (const [tokenName, props] of Object.entries(typography)) {
    const prefix = tokenNameToCssVar(tokenName);

    if (props.fontSize?.value !== undefined) {
      css += `  ${prefix}-font-size: ${props.fontSize.value}px;\n`;
    }
    if (props.lineHeight?.value !== undefined) {
      css += `  ${prefix}-line-height: ${props.lineHeight.value}px;\n`;
    }
    if (props.fontFamily?.value !== undefined) {
      css += `  ${prefix}-font-family: '${props.fontFamily.value}';\n`;
    }
    if (props.fontWeight?.value !== undefined) {
      css += `  ${prefix}-font-weight: ${props.fontWeight.value};\n`;
    }
    if (props.letterSpacing?.value !== undefined) {
      css += `  ${prefix}-letter-spacing: ${props.letterSpacing.value}px;\n`;
    }
    if (props.textCase?.value !== undefined && props.textCase.value !== 'none') {
      css += `  ${prefix}-text-transform: ${props.textCase.value};\n`;
    }
    if (props.textDecoration?.value !== undefined && props.textDecoration.value !== 'none') {
      css += `  ${prefix}-text-decoration: ${props.textDecoration.value};\n`;
    }
  }

  css += '}\n\n';

  css += '/* Typography utility classes (optional) */\n\n';

  for (const [tokenName, props] of Object.entries(typography)) {
    const parts = tokenName.replace(/\\/g, '-').replace(/\s+/g, '-').toLowerCase().split('-').filter(Boolean);
    const unique = [...new Set(parts)];
    const className = '.text-' + unique.join('-');
    const prefix = tokenNameToCssVar(tokenName);

    css += `${className} {\n`;
    css += `  font-size: var(${prefix}-font-size);\n`;
    css += `  line-height: var(${prefix}-line-height);\n`;
    css += `  font-family: var(${prefix}-font-family);\n`;
    css += `  font-weight: var(${prefix}-font-weight);\n`;
    css += `  letter-spacing: var(${prefix}-letter-spacing);\n`;
    css += '}\n\n';
  }

  return css;
}

let outputCss = '/* Auto-generated design tokens CSS */\n\n';

outputCss += '/* ==================== */\n';
outputCss += '/* COLOR TOKENS (ROLES) */\n';
outputCss += '/* ==================== */\n\n';

outputCss += generateColorCSS(colorTokens);

outputCss += '/* ==================== */\n';
outputCss += '/* TYPOGRAPHY TOKENS    */\n';
outputCss += '/* ==================== */\n\n';

outputCss += generateTypographyCSS(designTokens);

fs.writeFileSync(outputCssPath, outputCss, 'utf8');

console.log(`CSS tokens generated at: ${outputCssPath}`);
