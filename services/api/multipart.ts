/**
 * Susun FormData untuk endpoint multipart. Larik/objek bersarang memakai notasi Laravel:
 * outputs[0][item_id], container[container_code].
 */
export type FieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | FieldValue[]
  | { [key: string]: FieldValue };

export interface UploadFile {
  uri: string;
  name?: string;
  type?: string;
}

function append(form: FormData, key: string, value: FieldValue) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => append(form, `${key}[${i}]`, v));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => append(form, `${key}[${k}]`, v));
    return;
  }
  if (typeof value === 'boolean') {
    form.append(key, value ? '1' : '0');
    return;
  }
  form.append(key, String(value));
}

export function buildFormData(
  fields: Record<string, FieldValue>,
  files: Record<string, UploadFile | undefined> = {},
): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => append(form, k, v));
  Object.entries(files).forEach(([k, f]) => {
    if (!f) return;
    const name = f.name ?? f.uri.split('/').pop() ?? `${k}.jpg`;
    // React Native menerima objek { uri, name, type } sebagai berkas
    form.append(k, { uri: f.uri, name, type: f.type ?? 'image/jpeg' } as unknown as Blob);
  });
  return form;
}
