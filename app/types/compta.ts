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
