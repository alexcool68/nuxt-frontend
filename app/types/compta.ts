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
