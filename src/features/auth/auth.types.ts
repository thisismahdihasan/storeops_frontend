export type WorkspaceRole = "ADMIN" | "RESEARCHER" | "DESIGNER" | "LISTER";

export type CurrentUser = {
  createdAt: string;
  email: string;
  id: string;
  name: string | null;
};

export type CurrentSession = {
  user: CurrentUser;
};

export type ApiSuccess<TData> = {
  data: TData;
  message: string;
  success: true;
};

export type CurrentSessionResponse = ApiSuccess<CurrentSession>;

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  name?: string;
  password: string;
};

export type AuthResponse = ApiSuccess<{
  user: CurrentUser;
}>;
