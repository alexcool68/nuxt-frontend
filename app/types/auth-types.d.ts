export default interface SessionConfig {}

declare module "#auth" {
  interface AuthUser {
    user: {
      id: number;
      fullName?: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
  }

  interface SessionData extends AuthUser {}
}

// To switch to augmentation instead of ambient module
export {};
