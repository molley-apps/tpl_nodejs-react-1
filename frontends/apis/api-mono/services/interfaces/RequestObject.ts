export interface RequestObject {
  method: string
  path: string
  formData?: object
  params?: object
  qs?: object
  body?: object
  headers?: object
}
