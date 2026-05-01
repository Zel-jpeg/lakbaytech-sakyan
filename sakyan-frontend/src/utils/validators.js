import { z } from 'zod'

export const kycSchema = z.object({
  birthday: z.string().min(1, 'Birthday is required'),
  address: z.string().min(5, 'Address is required'),
  drivers_license_number: z.string().min(4, 'License number is required'),
  license_expiry: z.string().min(1, 'License expiry is required'),
  valid_id_type: z.string().min(1, 'Please select an ID type'),
})
