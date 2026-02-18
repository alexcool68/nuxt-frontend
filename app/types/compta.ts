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

// v1

// v0
export interface Chain {
  id?: number;
  code: string;
  description: string;
  steps: Step[];
}

export interface Step {
  id?: number;
  chainId?: number;
  name: string;
  rank: number;
  possibleFiles: StepFile[];
  files: File[];
}

export interface StepFile {
  id?: number;
  direction: "IN" | "OUT";
  logicalName: string;
  defaultPhysicalName: string;
  defaultCopybook: string;
}
export interface File {
  id?: number;
  stepId: number;
  direction: "IN" | "OUT";
  logicalName: string;
  defaultPhysicalName: string;
  defaultCopybook: string;
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
  direction?: "IN" | "OUT";
  logicalName: string; // Pour affichage
  defaultPhysicalName?: string;
  overridePhysicalName?: string;
  overrideLogicalName?: string;
  rules: Rule[];
}

export interface ConfigStep {
  id: number; // ID du catalogue Step
  name: string;
  isActive: boolean; // Calculé : est-ce que ce step est activé pour ce mvt ?
  movementStepId?: number; // ID de la liaison si activé
  possibleFiles?: FileConfig[];
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
