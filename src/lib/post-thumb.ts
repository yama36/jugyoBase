export type PostThumbAttachment = {
  id: string;
  kind: "image" | "pdf" | "slide" | "video";
  originalFilename: string;
  malwareScanStatus: "pending" | "clean" | "infected" | "error";
};

export function pickPostThumbAttachment(
  attachments: PostThumbAttachment[] | undefined,
): PostThumbAttachment | null {
  const list = attachments ?? [];
  const imageAttachment = list.find(
    (a) => a.kind === "image" && a.malwareScanStatus === "clean",
  );
  const videoAttachment = list.find(
    (a) => a.kind === "video" && a.malwareScanStatus === "clean",
  );
  const pdfAttachment = list.find(
    (a) => a.kind === "pdf" && a.malwareScanStatus === "clean",
  );
  const slideAttachment = list.find(
    (a) => a.kind === "slide" && a.malwareScanStatus === "clean",
  );
  return (
    imageAttachment ??
    videoAttachment ??
    pdfAttachment ??
    slideAttachment ??
    null
  );
}

export function postThumbKindLabel(kind: PostThumbAttachment["kind"]): string {
  if (kind === "image") return "画像";
  if (kind === "video") return "動画";
  if (kind === "slide") return "スライド";
  return "PDF";
}
