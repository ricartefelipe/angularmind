export type OnboardingStepId =
  | 'PROFILE_OK'
  | 'FIRST_BENEFICIARY'
  | 'FIRST_PIX'
  | 'VIEW_STATEMENT'

export type OnboardingStep = {
  id: OnboardingStepId
  done: boolean
}

export type OnboardingStatus = {
  steps: OnboardingStep[]
  completed: boolean
}
