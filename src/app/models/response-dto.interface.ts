export interface ResponseDTO {
    error: boolean,
    content: any // 'any' permite que 'content' sea cualquier cosa (un token, un usuario, etc.)
}