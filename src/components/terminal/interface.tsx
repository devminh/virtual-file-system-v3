export interface TerminalPageProps {
  rootFolder: { id: string; name: string };
}

export enum PathType {
  PATH = "PATH",
  FOLDER_PATH = "FOLDER_PATH",
  FILE_PATH = "FILE_PATH",
}

export interface FolderLs {
  name: string;
  created_at: string;
  size: number;
}
