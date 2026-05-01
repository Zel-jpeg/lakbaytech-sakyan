import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      // Step 1
      partner_type: '',
      // Step 2
      business_name: '',
      business_address: '',
      contact_person: '',
      contact_phone: '',
      // Step 3
      government_id_url: '',
      business_permit_url: '',

      // Actions
      setStep1: (data) => set({ partner_type: data.partner_type }),
      setStep2: (data) => set({ ...data }),
      setStep3: (data) => set({ ...data }),

      // Call this after successful submission
      reset: () => set({
        partner_type: '',
        business_name: '',
        business_address: '',
        contact_person: '',
        contact_phone: '',
        government_id_url: '',
        business_permit_url: '',
      }),

      // Derived helper — is step 2 reachable?
      isStep1Complete: () => !!get().partner_type,
      isStep2Complete: () => {
        const s = get()
        return !!(s.business_name && s.business_address && s.contact_person && s.contact_phone)
      },
    }),
    {
      name: 'sakyan-onboarding',          // sessionStorage key
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)