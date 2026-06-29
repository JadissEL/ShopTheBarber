/** Shared Clerk UI branding for ShopTheBarber auth pages. */
export const clerkAuthAppearance = {
  elements: {
    rootBox: 'mx-auto',
    card: 'bg-card border-border shadow-xl rounded-2xl ring-1 ring-border/50',
    headerTitle: 'text-foreground text-2xl font-bold',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButton: 'border-border hover:bg-muted text-foreground rounded-xl h-12',
    socialButtonsBlockButtonText: 'font-medium',
    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-md shadow-primary/20',
    formFieldInput: 'bg-card border-border text-foreground rounded-xl',
    formFieldLabel: 'text-muted-foreground font-medium',
    footerActionLink: 'text-primary hover:text-primary/90 font-semibold',
    footerActionText: 'text-muted-foreground',
    footerAction: 'pt-6 pb-2',
    footer__logo: 'hidden',
    footer__logoImage: 'hidden',
    footer__text: 'hidden',
    footerPages: 'hidden',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground text-xs',
    identityPreviewText: 'text-foreground',
    identityPreviewEditButton: 'text-primary',
    formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-foreground',
    otpCodeFieldInput: 'border-border text-foreground rounded-xl',
    formResendCodeLink: 'text-primary hover:text-primary/90',
    alertText: 'text-foreground',
    badge: 'hidden',
    developmentModeWarning: 'hidden',
  },
  layout: {
    logoPlacement: 'none',
  },
};

export const clerkSignInLocalization = {
  signIn: {
    start: {
      title: 'Sign in to ShopTheBarber',
      subtitle: 'Book barbers, manage appointments, and earn rewards',
    },
  },
};

export const clerkSignUpLocalization = {
  signUp: {
    start: {
      title: 'Create your ShopTheBarber account',
      subtitle: 'Join clients and pros on the premium grooming platform',
    },
  },
};
