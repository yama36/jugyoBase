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
  const pdfAttachment = list.find(
    (a) => a.kind === "pdf" && a.malwareScanStatus === "clean",
  );
  return imageAttachment ?? pdfAttachment ?? null;
}
