import { t } from './i18n';

export function disasterLabel(lang, type) {
  const key = `disaster_${type.replace(/\s+/g, '_')}`;
  const label = t(lang, key);
  return label === key ? type : label;
}

export function severityLabel(lang, id) {
  return t(lang, `severity_${id}`);
}

export function statusLabel(lang, status) {
  const key = `status_${status.replace(/\s+/g, '_')}`;
  const label = t(lang, key);
  return label === key ? status : label;
}

export function responderStatusLabel(lang, status) {
  const key = `resp_status_${status.replace(/\s+/g, '_')}`;
  const label = t(lang, key);
  return label === key ? status : label;
}
