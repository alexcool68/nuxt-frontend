export interface WorkflowRule {
  message: string;
  fix: string;
  details?: string;
}

export interface WorkflowFile {
  id: number;
  direction: "IN" | "OUT";
  logicalName: string;
  physicalName: string;
  copybook: string;
  isMonitored: boolean;
  hasAlert: boolean;
  rules: WorkflowRule[];
}

export interface WorkflowStep {
  sequence: number;
  chainName: string;
  stepName: string;
  inputs: WorkflowFile[];
  outputs: WorkflowFile[];
  hasWarning: boolean;
}

export interface WorkflowResponse {
  movement: string;
  description: string;
  workflow: WorkflowStep[];
}

export interface StepFile {
  id?: number;
  direction: "IN" | "OUT";
  logicalName: string;
  defaultPhysicalName: string;
  defaultCopybook: string;
}

export interface Step {
  id?: number;
  name: string;
  rank: number;
  possibleFiles: StepFile[];
}

export interface Chain {
  id: number;
  code: string;
  description: string;
  steps: Step[];
}

//  solo

export interface Rule {
  id?: number;
  message: string;
  fixInstruction: string;
}

export interface FileConfig {
  id?: number; // ID de la liaison (movement_step_file)
  stepFileId: number;
  logicalName: string; // Pour affichage
  rules: Rule[];
}

export interface ConfigStep {
  id: number; // ID du catalogue Step
  name: string;
  isActive: boolean; // Calculé : est-ce que ce step est activé pour ce mvt ?
  movementStepId?: number; // ID de la liaison si activé
  files: FileConfig[];
}

export interface ConfigChain {
  id: number; // ID du catalogue Chain
  movementChainId: number; // ID de la liaison
  code: string;
  steps: ConfigStep[];
}

export interface Movement {
  id: number;
  code: string;
  description: string;
  chains: ConfigChain[];
}

// Pour la liste déroulante d'ajout
export interface CatalogChain {
  id: number;
  code: string;
  description: string;
}
