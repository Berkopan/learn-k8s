import {parseAllDocuments, stringify} from 'yaml';

/** Editor drafts are separate from the parsed manifests used by kubectl apply. */
export function manifestText(file) {
  return typeof file === 'string' ? file : (file || []).map(document => stringify(document)).join('---\n');
}

export function fileDraft(files, drafts, name) {
  const draft = drafts?.[name];
  return draft && typeof draft.text === 'string'
    ? {text: draft.text, dirty: draft.dirty === true}
    : {text: name ? manifestText(files[name]) : '', dirty: false};
}

export function updateFileDraft(drafts, name, text, dirty = true) {
  return {...drafts, [name]: {text, dirty}};
}

export function parseManifestDraft(text) {
  if (text.length > 200000) throw new Error('Manifest en fazla 200 KB olabilir.');
  const documents = parseAllDocuments(text, {uniqueKeys: true, strict: true});
  if (!documents.length) throw new Error('Manifest boş.');
  return documents.map(document => {
    if (document.errors.length) throw new Error(document.errors[0].message);
    const value = document.toJS({maxAliasCount: 50});
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || !value.apiVersion || !value.kind || !value.metadata?.name) {
      throw new Error('Her belge apiVersion, kind ve metadata.name içermeli.');
    }
    return value;
  });
}
