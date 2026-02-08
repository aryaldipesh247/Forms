export enum QuestionType {
  CHOICE = 'CHOICE',
  TEXT = 'TEXT',
  DATE = 'DATE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  RANKING = 'RANKING',
  SECTION = 'SECTION',
  DOUBLE_RANKING_BOX = 'DOUBLE_RANKING_BOX',
  RATING = 'RATING',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD'
}

export interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  textAlign?: 'left' | 'center' | 'right';
}

export interface BranchingConfig {
  nextQuestionId: string | 'end' | 'next';
}

export interface ChoiceOption {
  id: string;
  text: string;
  branching?: BranchingConfig;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  showSubtitle?: boolean;
  required: boolean;
  longAnswer?: boolean;
  options?: ChoiceOption[];
  multipleSelection?: boolean;
  enableBranching?: boolean;
  branching?: BranchingConfig;
  titleFormatting?: TextFormat;
  columnName?: string; 
  columnNameSmall?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  timestamp: string;
  answers: Record<string, any>;
  serialNumber: number;
}

export interface ResponseArchive {
  id: string;
  deletedAt: string;
  responses: FormResponse[];
  formTitle: string;
  formId: string;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundVideoUrl?: string;
  themePreset?: string;
  headerBackgroundColor?: string;
  headerBackgroundImage?: string;
  headerBackgroundVideoUrl?: string;
  logoUrl?: string;
  logoAlignment?: 'left' | 'center' | 'right';
  logoScale?: number;
  logoFormatting?: TextFormat;
}

export interface FormDescription {
  id: string;
  text: string;
  formatting?: TextFormat;
  position?: { x: number; y: number };
  width?: number;
}

export interface Form {
  id: string;
  title: string;
  showTitle?: boolean;
  descriptions: FormDescription[];
  questions: Question[];
  createdAt: string;
  deletedAt?: string;
  responses: FormResponse[];
  archivedResponseSets?: ResponseArchive[];
  theme?: FormTheme;
  titleFormatting?: TextFormat;
  titlePosition?: { x: number; y: number };
  isPublished?: boolean;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  pin: string;
  password: string;
  firstName: string;
  lastName: string;
  forms: Form[];
}

export type View = 'dashboard' | 'editor' | 'preview' | 'responses' | 'recycle-bin' | 'settings';