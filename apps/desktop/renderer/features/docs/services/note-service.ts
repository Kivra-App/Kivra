import { fetchSyncedNotes, syncNote } from "@/core/supabase/sync-service";
import type { resolutionNote } from "@/features/docs/types/note";

const storagePrefix = "kivra.notes";

const getStorageKey = (projectId: string) => `${storagePrefix}.${projectId}`;

const parseNotes = (rawNotes: string | null): resolutionNote[] => {
  if (!rawNotes) {
    return [];
  }

  try {
    return JSON.parse(rawNotes) as resolutionNote[];
  } catch {
    return [];
  }
};

export const getProjectNotes = (projectId: string): resolutionNote[] =>
  parseNotes(window.localStorage.getItem(getStorageKey(projectId)));

export const getResolvedErrorIds = (projectId: string): Set<string> =>
  new Set(
    getProjectNotes(projectId)
      .filter((note) => note.content.trim().length > 0)
      .map((note) => note.errorId)
  );

const writeProjectNotes = (projectId: string, notes: resolutionNote[]) => {
  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(notes));
};

const mergeNotes = (
  localNotes: resolutionNote[],
  syncedNotes: resolutionNote[]
) => {
  const noteMap = new Map<string, resolutionNote>();

  for (const syncedNote of syncedNotes) {
    noteMap.set(syncedNote.id, syncedNote);
  }

  for (const localNote of localNotes) {
    noteMap.set(localNote.id, localNote);
  }

  return Array.from(noteMap.values()).sort(
    (firstNote, secondNote) =>
      new Date(secondNote.updatedAt).getTime() - new Date(firstNote.updatedAt).getTime()
  );
};

export const getMergedProjectNotes = async (
  projectId: string
): Promise<resolutionNote[]> => {
  const localNotes = getProjectNotes(projectId);
  const syncedNotes = await fetchSyncedNotes(projectId);
  const nextNotes = mergeNotes(localNotes, syncedNotes);

  if (syncedNotes.length > 0) {
    writeProjectNotes(projectId, nextNotes);
  }

  return nextNotes;
};

export const getErrorNote = (args: {
  errorId: string;
  projectId: string;
}): resolutionNote | null =>
  getProjectNotes(args.projectId).find((note) => note.errorId === args.errorId) ??
  null;

export const saveErrorNote = (args: {
  content: string;
  errorId: string;
  projectId: string;
}): resolutionNote => {
  const notes = getProjectNotes(args.projectId);
  const existingNote = notes.find((note) => note.errorId === args.errorId);
  const now = new Date().toISOString();
  const nextNote: resolutionNote = {
    id: existingNote?.id ?? crypto.randomUUID(),
    errorId: args.errorId,
    projectId: args.projectId,
    content: args.content,
    createdAt: existingNote?.createdAt ?? now,
    updatedAt: now
  };
  const nextNotes = [
    nextNote,
    ...notes.filter((note) => note.errorId !== args.errorId)
  ];

  writeProjectNotes(args.projectId, nextNotes);
  void syncNote(nextNote);

  return nextNote;
};
