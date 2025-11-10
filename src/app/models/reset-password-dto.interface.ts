export interface ResetPasswordDTO {
    email: string;
    token: string;
    newPassword: string;
}