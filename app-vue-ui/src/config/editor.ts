// Editor configuration

export enum EditorType {
  MARKDOWN = 'markdown',
  MEDIUM = 'medium'
}

export interface EditorConfig {
  type: EditorType;
  defaultType: EditorType;
}

const editorConfig: EditorConfig = {
  type: EditorType.MEDIUM, // Current editor type
  defaultType: EditorType.MEDIUM // Default editor type
};

export default editorConfig;
