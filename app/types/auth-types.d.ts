export default interface SessionConfig {}

// One way
interface SessionUser {
  user: {
    id: string | number;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

declare module "#auth" {
  interface SessionData extends SessionUser {}
}

// To switch to augmentation instead of ambient module
export {};
