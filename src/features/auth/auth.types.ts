export type WorkspaceRole = "ADMIN" | "RESEARCHER" | "DESIGNER" | "LISTER";

export type CurrentUser = {
  createdAt: string;
  email: string;
  id: string;
  name: string | null;
  profileImageUrl: string | null;
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

export type ForgotPasswordRequestInput = {
  email: string;
};

export type ForgotPasswordVerifyInput = {
  code: string;
  email: string;
};

export type ForgotPasswordResetInput = {
  confirmPassword: string;
  email: string;
  password: string;
  resetToken: string;
};

export type ForgotPasswordVerifyResponse = ApiSuccess<{
  resetToken: string;
}>;

export type GenericAuthResponse = {
  message: string;
  success: true;
};
