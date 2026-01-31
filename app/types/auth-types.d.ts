export default interface SessionConfig {}

declare module "#auth" {
  export default interface SessionUser {
    id: number;
    fullName?: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }
  export interface SessionData extends SessionUser {}
}

// To switch to augmentation instead of ambient module
export {};
