/** Shared helpers for reading/updating the Dockerfile PAPERCLIP_REF pin. */

export function readCurrentRef(dockerfile) {
  const m = dockerfile.match(/\nARG PAPERCLIP_REF=([^\n]+)\n/);
  return m ? m[1].trim() : null;
}

export function replaceRef(dockerfile, next) {
  const re = /\nARG PAPERCLIP_REF=([^\n]+)\n/;
  if (!re.test(dockerfile)) throw new Error("Could not find PAPERCLIP_REF line");
  return dockerfile.replace(re, `\nARG PAPERCLIP_REF=${next}\n`);
}
